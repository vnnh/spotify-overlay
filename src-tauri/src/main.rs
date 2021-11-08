#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use async_std::io::prelude::BufReadExt;
use async_std::io::BufReader;
use async_std::net::TcpStream as AsyncTcpStream;
use async_std::{net::TcpListener, prelude::*};
use oauth2::basic::BasicClient;
use oauth2::http::{HeaderMap, Method};
use oauth2::reqwest::async_http_client;
use oauth2::HttpRequest;
use oauth2::{
  AccessToken, AuthUrl, AuthorizationCode, ClientId, ClientSecret, CsrfToken, PkceCodeChallenge,
  RedirectUrl, RefreshToken, Scope, TokenResponse, TokenUrl,
};
use std::io::Write;
use std::net::TcpStream;
use std::str;
use tauri::{
  command, generate_context, generate_handler, CustomMenuItem, Manager, SystemTray,
  SystemTrayEvent, SystemTrayMenu, WindowBuilder, WindowEvent, WindowUrl,
};
use url::Url;

fn create_client() -> BasicClient {
  BasicClient::new(
    ClientId::new("39e0135aefc649cba0e0fc02b0433830".to_string()),
    Some(ClientSecret::new(
      "39e0135aefc649cba0e0fc02b0433831".to_string(),
    )),
    //This isn't the real secret, for some reason Spotify returns an error unless the ClientSecret is something that is the same length(? haven't tested)
    AuthUrl::new("https://accounts.spotify.com/authorize".to_string()).unwrap(),
    Some(TokenUrl::new("https://accounts.spotify.com/api/token".to_string()).unwrap()),
  )
  .set_redirect_uri(RedirectUrl::new("http://localhost:3003".to_string()).unwrap())
}

async fn get_access_token(refresh_token: String) -> Result<(AccessToken, RefreshToken), ()> {
  let client = create_client();
  let response = client
    .exchange_refresh_token(&RefreshToken::new(refresh_token))
    .request_async(async_http_client)
    .await;

  if let Ok(response) = response {
    Ok((
      response.access_token().clone(),
      response.refresh_token().unwrap().clone(),
    ))
  } else {
    Err(())
  }
}

#[command]
async fn get_playback_state(
  app_handle: tauri::AppHandle,
  refresh_token: String,
) -> Result<(serde_json::Value, String), ()> {
  let get_result = get_access_token(refresh_token).await;
  if let Ok((access_token, refresh_token)) = get_result {
    let mut headers = HeaderMap::new();
    headers.insert("Accept", "application/json".parse().unwrap());
    headers.insert("Content-Type", "application/json".parse().unwrap());
    headers.insert(
      "Authorization",
      format!("Bearer {}", access_token.secret()).parse().unwrap(),
    );

    let response = async_http_client(HttpRequest {
      url: Url::parse("https://api.spotify.com/v1/me/player/currently-playing").unwrap(),
      method: Method::GET,
      headers: headers,
      body: vec![],
    })
    .await
    .unwrap();

    Ok((
      serde_json::from_slice(response.body.as_ref()).expect("Failed to parse JSON"),
      refresh_token.secret().clone(),
    ))
  } else {
    app_handle.emit_all("reauthenticate", true).unwrap();
    Err(())
  }
}

#[command]
async fn modify_player(
  app_handle: tauri::AppHandle,
  refresh_token: String,
  action: &str,
) -> Result<(bool, String), ()> {
  let get_result = get_access_token(refresh_token).await;
  if let Ok((access_token, refresh_token)) = get_result {
    let mut headers = HeaderMap::new();
    headers.insert("Accept", "application/json".parse().unwrap());
    headers.insert("Content-Type", "application/json".parse().unwrap());
    headers.insert(
      "Authorization",
      format!("Bearer {}", access_token.secret()).parse().unwrap(),
    );

    let response = match action {
      "prev" => Some(
        async_http_client(HttpRequest {
          url: Url::parse("https://api.spotify.com/v1/me/player/previous").unwrap(),
          method: Method::POST,
          headers: headers,
          body: vec![],
        })
        .await
        .unwrap(),
      ),
      "next" => Some(
        async_http_client(HttpRequest {
          url: Url::parse("https://api.spotify.com/v1/me/player/next").unwrap(),
          method: Method::POST,
          headers: headers,
          body: vec![],
        })
        .await
        .unwrap(),
      ),
      "pause" => Some(
        async_http_client(HttpRequest {
          url: Url::parse("https://api.spotify.com/v1/me/player/pause").unwrap(),
          method: Method::PUT,
          headers: headers,
          body: vec![],
        })
        .await
        .unwrap(),
      ),
      "play" => Some(
        async_http_client(HttpRequest {
          url: Url::parse("https://api.spotify.com/v1/me/player/play").unwrap(),
          method: Method::PUT,
          headers: headers,
          body: vec![],
        })
        .await
        .unwrap(),
      ),
      _ => None,
    };

    if let Some(r) = response {
      Ok((r.status_code.is_success(), refresh_token.secret().clone()))
    } else {
      Ok((false, refresh_token.secret().clone()))
    }
  } else {
    app_handle.emit_all("reauthenticate", true).unwrap();
    Err(())
  }
}

#[command]
async fn authenticate_user(app_handle: tauri::AppHandle) -> Result<Option<String>, ()> {
  if app_handle.get_window("Authorization").is_some() {
    return Ok(None);
  }

  let client = create_client();

  let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

  let (auth_url, csrf_token) = client
    .authorize_url(CsrfToken::new_random)
    .add_scope(Scope::new("user-read-currently-playing".to_string()))
    .add_scope(Scope::new("user-read-playback-state".to_string()))
    .add_scope(Scope::new("user-modify-playback-state".to_string()))
    .set_pkce_challenge(pkce_challenge)
    .url();

  app_handle
    .create_window(
      "Authorization".to_string(),
      WindowUrl::External(auth_url),
      |window_builder, webview_attributes| {
        (window_builder.title("Authorization"), webview_attributes)
      },
    )
    .unwrap();

  if let Some(window) = app_handle.get_window("Authorization") {
    window.on_window_event(move |event| match event {
      WindowEvent::CloseRequested => {
        let stream = TcpStream::connect("127.0.0.1:3003");
        if let Ok(mut stream) = stream {
          stream
            .set_nonblocking(false)
            .expect("Could not make stream block");
          stream.write(&[1]).expect("Could not write to stream");
        } else {
          println!("Failed to connect to stream on WindowEvent::CloseRequested")
        }
      }
      _ => (),
    })
  }

  let listener = TcpListener::bind("127.0.0.1:3003").await.unwrap();
  let mut incoming = listener.incoming();
  let mut refresh_token_secret: Option<String> = None;
  while let Some(stream) = incoming.next().await {
    let mut stream: AsyncTcpStream = stream.expect(".");
    let mut code: Option<AuthorizationCode> = None;
    let mut state: Option<CsrfToken> = None;
    let mut reader = BufReader::new(&stream);
    let mut request_line = String::new();
    reader.read_line(&mut request_line).await.unwrap();

    if request_line != str::from_utf8(&[1]).unwrap() {
      let redirect_url = request_line.split_whitespace().nth(1);
      if let Some(redirect_url) = redirect_url {
        let url = Url::parse(&("http://localhost".to_string() + redirect_url)).unwrap();

        let code_pair = url
          .query_pairs()
          .find(|pair| {
            let &(ref key, _) = pair;
            key == "code"
          })
          .unwrap();

        let (_, value) = code_pair;
        code = Some(AuthorizationCode::new(value.into_owned()));

        let state_pair = url
          .query_pairs()
          .find(|pair| {
            let &(ref key, _) = pair;
            key == "state"
          })
          .unwrap();

        let (_, value) = state_pair;
        state = Some(CsrfToken::new(value.into_owned()));
      }

      match (code, state) {
        (Some(code), Some(state)) => {
          if state.secret() != csrf_token.secret() {
            ()
          }

          let token = client
            .exchange_code(code)
            .set_pkce_verifier(pkce_verifier)
            .request_async(async_http_client);

          refresh_token_secret = Some(String::from(
            token.await.unwrap().refresh_token().unwrap().secret(),
          ));

          let message = "Authorization complete!";
          let response = format!(
            "HTTP/1.1 200 OK\r\ncontent-length: {}\r\n\r\n{}",
            message.len(),
            message
          );

          stream.write_all(response.as_bytes()).await.unwrap();
        }
        _ => (),
      }
    }

    break;
  }

  Ok(refresh_token_secret)
}

fn main() {
  let tray = SystemTray::new()
    .with_menu(SystemTrayMenu::new().add_item(CustomMenuItem::new("logout", "Logout")));

  tauri::Builder::default()
    .system_tray(tray)
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "logout" => {
          app.emit_all("reauthenticate", true).unwrap();
        }
        _ => {}
      },
      _ => {}
    })
    .invoke_handler(generate_handler![
      authenticate_user,
      get_playback_state,
      modify_player
    ])
    .run(generate_context!())
    .expect("error while running tauri application");
}

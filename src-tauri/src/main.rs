// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use enigo::{Enigo, MouseControllable, KeyboardControllable};
use screenshots::Screen;
use std::sync::Mutex;
use tauri::State;
use serde::{Deserialize, Serialize};
use base64::{engine::general_purpose, Engine as _};
use uuid::Uuid;
use std::collections::HashMap;

// Estructuras para los comandos remotos
#[derive(Debug, Serialize, Deserialize)]
pub struct MouseCommand {
    pub x: i32,
    pub y: i32,
    pub button: String, // "left", "right", "middle"
    pub action: String, // "click", "double_click", "press", "release"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KeyboardCommand {
    pub key: String,
    pub action: String, // "press", "release", "type"
    pub modifiers: Vec<String>, // "ctrl", "alt", "shift"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScreenshotResponse {
    pub image_data: String, // Base64 encoded image
    pub width: u32,
    pub height: u32,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RemoteSession {
    pub id: String,
    pub active: bool,
    pub client_id: String,
    pub admin_id: String,
    pub started_at: String,
}

// Estado global para las sesiones remotas
type SessionsState = Mutex<HashMap<String, RemoteSession>>;

// Comando para capturar la pantalla
#[tauri::command]
async fn capture_screen() -> Result<ScreenshotResponse, String> {
    println!("📸 Capturando pantalla...");
    
    // Por ahora vamos a crear una imagen de prueba simple
    // En un entorno real, aquí se implementaría la captura real
    let width = 800u32;
    let height = 600u32;
    
    // Crear una imagen de prueba (cuadros de colores)
    let mut imgbuf = image::ImageBuffer::new(width, height);
    
    for (x, y, pixel) in imgbuf.enumerate_pixels_mut() {
        let r = (0.3 * x as f32) as u8;
        let g = (0.3 * y as f32) as u8;
        let b = ((x + y) % 255) as u8;
        *pixel = image::Rgba([r, g, b, 255]);
    }
    
    // Convertir a PNG
    let mut buffer = Vec::new();
    {
        let mut cursor = std::io::Cursor::new(&mut buffer);
        let dynamic_img = image::DynamicImage::ImageRgba8(imgbuf);
        dynamic_img.write_to(&mut cursor, image::ImageFormat::Png)
            .map_err(|e| format!("Error codificando imagen: {}", e))?;
    }
    
    let base64_image = general_purpose::STANDARD.encode(&buffer);
    
    println!("✅ Imagen de prueba generada: {}x{}", width, height);
    
    Ok(ScreenshotResponse {
        image_data: base64_image,
        width,
        height,
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

// Comando para ejecutar acciones de mouse
#[tauri::command]
async fn execute_mouse_command(command: MouseCommand) -> Result<String, String> {
    println!("🖱️ Ejecutando comando de mouse: {:?}", command);
    
    let mut enigo = Enigo::new();
    
    // Mover mouse a la posición
    enigo.mouse_move_to(command.x, command.y);
    
    // Ejecutar la acción correspondiente
    match command.action.as_str() {
        "click" => {
            match command.button.as_str() {
                "left" => enigo.mouse_click(enigo::MouseButton::Left),
                "right" => enigo.mouse_click(enigo::MouseButton::Right),
                "middle" => enigo.mouse_click(enigo::MouseButton::Middle),
                _ => return Err(format!("Botón de mouse no válido: {}", command.button)),
            }
        },
        "double_click" => {
            if command.button == "left" {
                enigo.mouse_click(enigo::MouseButton::Left);
                std::thread::sleep(std::time::Duration::from_millis(50));
                enigo.mouse_click(enigo::MouseButton::Left);
            } else {
                return Err("Double click solo soportado para botón izquierdo".to_string());
            }
        },
        "press" => {
            match command.button.as_str() {
                "left" => enigo.mouse_down(enigo::MouseButton::Left),
                "right" => enigo.mouse_down(enigo::MouseButton::Right),
                "middle" => enigo.mouse_down(enigo::MouseButton::Middle),
                _ => return Err(format!("Botón de mouse no válido: {}", command.button)),
            }
        },
        "release" => {
            match command.button.as_str() {
                "left" => enigo.mouse_up(enigo::MouseButton::Left),
                "right" => enigo.mouse_up(enigo::MouseButton::Right),
                "middle" => enigo.mouse_up(enigo::MouseButton::Middle),
                _ => return Err(format!("Botón de mouse no válido: {}", command.button)),
            }
        },
        _ => return Err(format!("Acción de mouse no válida: {}", command.action)),
    }
    
    println!("✅ Comando de mouse ejecutado exitosamente");
    Ok("Comando de mouse ejecutado".to_string())
}

// Comando para ejecutar acciones de teclado
#[tauri::command]
async fn execute_keyboard_command(command: KeyboardCommand) -> Result<String, String> {
    println!("⌨️ Ejecutando comando de teclado: {:?}", command);
    
    let mut enigo = Enigo::new();
    
    match command.action.as_str() {
        "type" => {
            // Escribir texto directamente
            enigo.key_sequence(&command.key);
        },
        "press" => {
            // Aplicar modificadores primero
            for modifier in &command.modifiers {
                match modifier.as_str() {
                    "ctrl" => enigo.key_down(enigo::Key::Control),
                    "alt" => enigo.key_down(enigo::Key::Alt),
                    "shift" => enigo.key_down(enigo::Key::Shift),
                    _ => {}
                }
            }
            
            // Presionar la tecla principal
            let key = match command.key.as_str() {
                "Enter" => enigo::Key::Return,
                "Escape" => enigo::Key::Escape,
                "Space" => enigo::Key::Space,
                "Tab" => enigo::Key::Tab,
                "Backspace" => enigo::Key::Backspace,
                "Delete" => enigo::Key::Delete,
                "ArrowUp" => enigo::Key::UpArrow,
                "ArrowDown" => enigo::Key::DownArrow,
                "ArrowLeft" => enigo::Key::LeftArrow,
                "ArrowRight" => enigo::Key::RightArrow,
                "F1" => enigo::Key::F1,
                "F2" => enigo::Key::F2,
                "F3" => enigo::Key::F3,
                "F4" => enigo::Key::F4,
                "F5" => enigo::Key::F5,
                "F6" => enigo::Key::F6,
                "F7" => enigo::Key::F7,
                "F8" => enigo::Key::F8,
                "F9" => enigo::Key::F9,
                "F10" => enigo::Key::F10,
                "F11" => enigo::Key::F11,
                "F12" => enigo::Key::F12,
                _ => {
                    // Para caracteres individuales
                    if command.key.len() == 1 {
                        let ch = command.key.chars().next().unwrap();
                        enigo.key_sequence(&ch.to_string());
                        return Ok("Comando de teclado ejecutado".to_string());
                    } else {
                        return Err(format!("Tecla no reconocida: {}", command.key));
                    }
                }
            };
            
            enigo.key_down(key);
            
            // Liberar modificadores
            for modifier in &command.modifiers {
                match modifier.as_str() {
                    "ctrl" => enigo.key_up(enigo::Key::Control),
                    "alt" => enigo.key_up(enigo::Key::Alt),
                    "shift" => enigo.key_up(enigo::Key::Shift),
                    _ => {}
                }
            }
            
            enigo.key_up(key);
        },
        _ => return Err(format!("Acción de teclado no válida: {}", command.action)),
    }
    
    println!("✅ Comando de teclado ejecutado exitosamente");
    Ok("Comando de teclado ejecutado".to_string())
}

// Comando para crear una nueva sesión remota
#[tauri::command]
async fn create_remote_session(
    client_id: String,
    admin_id: String,
    sessions: State<'_, SessionsState>,
) -> Result<RemoteSession, String> {
    println!("🔗 Creando nueva sesión remota...");
    
    let session_id = Uuid::new_v4().to_string();
    let session = RemoteSession {
        id: session_id.clone(),
        active: true,
        client_id,
        admin_id,
        started_at: chrono::Utc::now().to_rfc3339(),
    };
    
    let mut sessions_map = sessions.lock().unwrap();
    sessions_map.insert(session_id.clone(), session.clone());
    
    println!("✅ Sesión remota creada: {}", session_id);
    Ok(session)
}

// Comando para terminar una sesión remota
#[tauri::command]
async fn end_remote_session(
    session_id: String,
    sessions: State<'_, SessionsState>,
) -> Result<String, String> {
    println!("🔚 Terminando sesión remota: {}", session_id);
    
    let mut sessions_map = sessions.lock().unwrap();
    if let Some(session) = sessions_map.get_mut(&session_id) {
        session.active = false;
        println!("✅ Sesión remota terminada: {}", session_id);
        Ok("Sesión terminada".to_string())
    } else {
        Err("Sesión no encontrada".to_string())
    }
}

// Comando para obtener el estado de una sesión
#[tauri::command]
async fn get_session_status(
    session_id: String,
    sessions: State<'_, SessionsState>,
) -> Result<RemoteSession, String> {
    let sessions_map = sessions.lock().unwrap();
    if let Some(session) = sessions_map.get(&session_id) {
        Ok(session.clone())
    } else {
        Err("Sesión no encontrada".to_string())
    }
}

// Comando para obtener información del sistema
#[tauri::command]
async fn get_system_info() -> Result<serde_json::Value, String> {
    println!("💻 Obteniendo información del sistema...");
    
    let screens = Screen::all().map_err(|e| format!("Error obteniendo pantallas: {}", e))?;
    
    let screen_info: Vec<serde_json::Value> = screens
        .iter()
        .enumerate()
        .map(|(index, screen)| {
            serde_json::json!({
                "id": index,
                "width": screen.display_info.width,
                "height": screen.display_info.height,
                "x": screen.display_info.x,
                "y": screen.display_info.y,
                "is_primary": screen.display_info.is_primary
            })
        })
        .collect();
    
    let system_info = serde_json::json!({
        "screens": screen_info,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "platform": std::env::consts::OS
    });
    
    println!("✅ Información del sistema obtenida");
    Ok(system_info)
}

fn main() {
    println!("🚀 Iniciando HelpDesk Tauri con capacidades de control remoto...");
    
    tauri::Builder::default()
        .manage(SessionsState::default())
        .invoke_handler(tauri::generate_handler![
            capture_screen,
            execute_mouse_command,
            execute_keyboard_command,
            create_remote_session,
            end_remote_session,
            get_session_status,
            get_system_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

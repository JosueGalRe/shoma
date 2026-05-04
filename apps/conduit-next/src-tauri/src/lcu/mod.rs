// Manual LCU HTTP/WebSocket modules are retained for compatibility, shared event/error
// types, and unit coverage; production connection setup uses the Irelia adapters below.
pub mod http;
pub mod irelia_http;
pub mod irelia_websocket;
pub mod lockfile;
pub mod websocket;

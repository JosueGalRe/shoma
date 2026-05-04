// Production LCU HTTP/WebSocket clients use lockfile credentials directly.
// Irelia adapters are kept as reference implementations but are not used by default
// because Irelia's auto-discovery (get_port_and_auth) fails on some Windows setups.
pub mod http;
pub mod irelia_http;
pub mod irelia_websocket;
pub mod lockfile;
pub mod websocket;

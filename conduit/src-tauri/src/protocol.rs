use serde::{
    de::{Error as DeError, SeqAccess, Visitor},
    Deserialize, Deserializer, Serialize, Serializer,
};
use serde_json::Value;
use std::fmt;

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RiftOpcode {
    Open = 1,
    Msg = 2,
    Close = 3,
    Connect = 4,
    ConnectPubkey = 5,
    Send = 6,
    Reply = 7,
    Receive = 8,
    Error = 9,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct RiftErrorPayload {
    pub code: String,
    pub message: Option<String>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum MobileOpcode {
    Secret = 1,
    SecretResponse = 2,
    Version = 3,
    VersionResponse = 4,
    Subscribe = 5,
    Unsubscribe = 6,
    Request = 7,
    Response = 8,
    Update = 9,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RiftFrame {
    pub opcode: RiftOpcode,
    pub args: Vec<Value>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MobileFrame {
    pub opcode: MobileOpcode,
    pub args: Vec<Value>,
}

impl RiftFrame {
    pub fn new(opcode: RiftOpcode, args: Vec<Value>) -> Self {
        Self { opcode, args }
    }
}

impl MobileFrame {
    pub fn new(opcode: MobileOpcode, args: Vec<Value>) -> Self {
        Self { opcode, args }
    }
}

impl TryFrom<u64> for RiftOpcode {
    type Error = ();

    fn try_from(value: u64) -> Result<Self, ()> {
        match value {
            1 => Ok(Self::Open),
            2 => Ok(Self::Msg),
            3 => Ok(Self::Close),
            4 => Ok(Self::Connect),
            5 => Ok(Self::ConnectPubkey),
            6 => Ok(Self::Send),
            7 => Ok(Self::Reply),
            8 => Ok(Self::Receive),
            9 => Ok(Self::Error),
            _ => Err(()),
        }
    }
}

impl TryFrom<u64> for MobileOpcode {
    type Error = ();

    fn try_from(value: u64) -> Result<Self, Self::Error> {
        match value {
            1 => Ok(Self::Secret),
            2 => Ok(Self::SecretResponse),
            3 => Ok(Self::Version),
            4 => Ok(Self::VersionResponse),
            5 => Ok(Self::Subscribe),
            6 => Ok(Self::Unsubscribe),
            7 => Ok(Self::Request),
            8 => Ok(Self::Response),
            9 => Ok(Self::Update),
            _ => Err(()),
        }
    }
}

impl From<RiftOpcode> for u64 {
    fn from(opcode: RiftOpcode) -> Self {
        opcode as u64
    }
}

impl From<MobileOpcode> for u64 {
    fn from(opcode: MobileOpcode) -> Self {
        opcode as u64
    }
}

impl Serialize for RiftOpcode {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u64((*self).into())
    }
}

impl<'de> Deserialize<'de> for RiftOpcode {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = u64::deserialize(deserializer)?;
        Self::try_from(value).map_err(|_| DeError::custom(format!("invalid Rift opcode: {value}")))
    }
}

impl Serialize for MobileOpcode {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u64((*self).into())
    }
}

impl<'de> Deserialize<'de> for MobileOpcode {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let value = u64::deserialize(deserializer)?;
        Self::try_from(value)
            .map_err(|_| DeError::custom(format!("invalid Mobile opcode: {value}")))
    }
}

impl Serialize for RiftFrame {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serialize_frame(self.opcode, &self.args, serializer)
    }
}

impl<'de> Deserialize<'de> for RiftFrame {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_seq(FrameVisitor::new("RiftFrame", RiftFrame::new))
    }
}

impl Serialize for MobileFrame {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serialize_frame(self.opcode, &self.args, serializer)
    }
}

impl<'de> Deserialize<'de> for MobileFrame {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_seq(FrameVisitor::new("MobileFrame", MobileFrame::new))
    }
}

fn serialize_frame<S, O>(opcode: O, args: &[Value], serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
    O: Into<u64>,
{
    let mut frame = Vec::with_capacity(args.len() + 1);
    frame.push(Value::from(opcode.into()));
    frame.extend(args.iter().cloned());
    frame.serialize(serializer)
}

struct FrameVisitor<O, F> {
    name: &'static str,
    build: F,
    _opcode: std::marker::PhantomData<O>,
}

impl<O, F> FrameVisitor<O, F> {
    fn new(name: &'static str, build: F) -> Self {
        Self {
            name,
            build,
            _opcode: std::marker::PhantomData,
        }
    }
}

impl<'de, O, T, F> Visitor<'de> for FrameVisitor<O, F>
where
    O: Deserialize<'de>,
    F: Fn(O, Vec<Value>) -> T,
{
    type Value = T;

    fn expecting(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{} as [opcode, ...args]", self.name)
    }

    fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
    where
        A: SeqAccess<'de>,
    {
        let opcode = seq
            .next_element::<O>()?
            .ok_or_else(|| DeError::invalid_length(0, &self))?;
        let mut args = Vec::new();

        while let Some(arg) = seq.next_element()? {
            args.push(arg);
        }

        Ok((self.build)(opcode, args))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn serializes_rift_frame_as_array() {
        let frame = RiftFrame::new(
            RiftOpcode::ConnectPubkey,
            vec![Value::from("public_key_base64")],
        );

        let value = serde_json::to_value(frame).unwrap();

        assert_eq!(value, json!([5, "public_key_base64"]));
    }

    #[test]
    fn deserializes_rift_frame_from_array() {
        let frame: RiftFrame =
            serde_json::from_value(json!([6, "request-id", { "path": "/lol" }])).unwrap();

        assert_eq!(frame.opcode, RiftOpcode::Send);
        assert_eq!(
            frame.args,
            vec![json!("request-id"), json!({ "path": "/lol" })]
        );
    }

    #[test]
    fn serializes_mobile_frame_as_array() {
        let frame = MobileFrame::new(MobileOpcode::VersionResponse, vec![Value::from(1)]);

        let value = serde_json::to_value(frame).unwrap();

        assert_eq!(value, json!([4, 1]));
    }

    #[test]
    fn deserializes_mobile_frame_from_array() {
        let frame: MobileFrame =
            serde_json::from_value(json!([9, "event", { "ready": true }])).unwrap();

        assert_eq!(frame.opcode, MobileOpcode::Update);
        assert_eq!(frame.args, vec![json!("event"), json!({ "ready": true })]);
    }

    #[test]
    fn rejects_unknown_opcode() {
        let error = serde_json::from_value::<RiftFrame>(json!([99])).unwrap_err();

        assert!(error.to_string().contains("invalid Rift opcode: 99"));
    }

    #[test]
    fn deserializes_rift_error_frame() {
        let frame: RiftFrame = serde_json::from_value(json!([
            9,
            { "code": "relay_unreachable", "message": "hub disconnected" }
        ]))
        .unwrap();
        let payload: RiftErrorPayload = serde_json::from_value(frame.args[0].clone()).unwrap();

        assert_eq!(frame.opcode, RiftOpcode::Error);
        assert_eq!(payload.code, "relay_unreachable");
        assert_eq!(payload.message, Some("hub disconnected".to_string()));
    }

    #[test]
    fn rejects_empty_frame() {
        let error = serde_json::from_value::<MobileFrame>(json!([])).unwrap_err();

        assert!(error.to_string().contains("invalid length 0"));
    }
}

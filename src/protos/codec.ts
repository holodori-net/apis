import {
  create,
  type DescMessage,
  fromBinary,
  type MessageInitShape,
  type MessageShape,
  toBinary,
} from "@bufbuild/protobuf";

export type ProtobufMessageInit<Schema extends DescMessage> =
  MessageInitShape<Schema>;

export function encodeProtobuf<Schema extends DescMessage>(
  schema: Schema,
  value?: MessageInitShape<Schema>,
): Buffer {
  return Buffer.from(toBinary(schema, create(schema, value)));
}

export function decodeProtobuf<Schema extends DescMessage>(
  schema: Schema,
  data: Buffer,
): MessageShape<Schema> {
  return fromBinary(schema, data);
}

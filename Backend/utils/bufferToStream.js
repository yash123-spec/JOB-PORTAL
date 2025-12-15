import { Readable } from "stream"

const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable.push(buffer);   // Push the buffer content
  readable.push(null);     // Mark end of stream
  return readable;
};

export { bufferToStream };
export default bufferToStream;
import io from "socket.io-client";
import config from "../config";

const socket = io(config.SOCKET_BASE_URL);

export default socket;

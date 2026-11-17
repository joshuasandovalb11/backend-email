// api/send-mail.js
import { createSendMailHandler } from "../lib/send-mail-handler.js";

export default createSendMailHandler({ requireAuth: false });

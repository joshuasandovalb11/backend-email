// api/v2/send-mail.js
import { createSendMailHandler } from "../../lib/send-mail-handler.js";

export default createSendMailHandler({ requireAuth: true });

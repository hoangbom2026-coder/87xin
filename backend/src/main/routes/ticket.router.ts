import express from 'express';
import auth from '@middlewares/auth';
import adminOnly from '@middlewares/admin-only';
import * as ticketController from '@main/controllers/ticket.controller';

const router = express.Router();

router.get('/', auth, ticketController.getTickets);
router.post('/', auth, ticketController.createTicket);
router.get('/:ticketId', auth, ticketController.getTicketById);
router.post('/:ticketId/reply', auth, ticketController.replyTicket);
router.patch('/:ticketId/close', auth, adminOnly, ticketController.closeTicket);

export default router;

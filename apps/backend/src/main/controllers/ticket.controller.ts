import httpStatus from 'http-status';
import { Response } from 'express';
import ApiError from '@utils/ApiError';
import catchAsync from '@utils/catchAsync';
import { AuthRequest } from '@middlewares/auth';
import ticketService from '@main/services/ticket.service';
import telegramService from '@main/services/telegram.service';

export const getTickets = catchAsync(async (req: AuthRequest, res: Response) => {
    const filter: any = {};
    if (req.user!.role !== 'admin') {
        filter.userId = req.user!._id;
    }
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)));
    const { items, total } = await ticketService.listTickets(filter, page, limit);
    return res.send({ items, total, page, limit });
});

export const createTicket = catchAsync(async (req: AuthRequest, res: Response) => {
    const ticket = await ticketService.createTicket({
        ...req.body,
        userId: req.user!._id
    });

    // Notify admin via Telegram
    telegramService.notifyNewTicket(
        String(req.user!.username),
        req.body.subject
    ).catch(() => undefined);

    return res.status(httpStatus.CREATED).send(ticket);
});

export const getTicketById = catchAsync(async (req: AuthRequest, res: Response) => {
    const ticket = await ticketService.getTicketById((req.params as any).ticketId);
    if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');
    return res.send(ticket);
});

export const replyTicket = catchAsync(async (req: AuthRequest, res: Response) => {
    const { ticketId } = (req.params as any);
    const { message } = req.body;

    const reply: any = {
        message,
        createdAt: new Date()
    };

    if (req.user!.role === 'admin') {
        reply.adminId = req.user!._id;
    } else {
        reply.userId = req.user!._id;
    }

    const ticket = await ticketService.patchTicket(ticketId, {
        $push: { replies: reply },
        status: req.user!.role === 'admin' ? 'answered' : 'replied'
    });

    if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');
    return res.send(ticket);
});

export const closeTicket = catchAsync(async (req: AuthRequest, res: Response) => {
    const ticket = await ticketService.closeTicket((req.params as any).ticketId);
    if (!ticket) throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');
    return res.send(ticket);
});

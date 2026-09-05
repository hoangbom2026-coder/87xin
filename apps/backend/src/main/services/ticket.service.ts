import TicketModel from '@main/models/ticket.model';

const listTickets = async (filter: any, page = 1, limit = 20) => {
    const [items, total] = await Promise.all([
        TicketModel.find(filter)
            .populate('userId', 'username email')
            .sort({ updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        TicketModel.countDocuments(filter)
    ]);
    return { items, total, page, limit };
};

const createTicket = async (data: any) => TicketModel.create(data);

const getTicketById = async (id: string) => TicketModel.findById(id).populate('userId', 'username email');

const patchTicket = async (id: string, update: any) => TicketModel.findByIdAndUpdate(id, update, { new: true });

const closeTicket = async (id: string) => TicketModel.findByIdAndUpdate(id, { status: 'closed' }, { new: true });

export default { listTickets, createTicket, getTicketById, patchTicket, closeTicket };
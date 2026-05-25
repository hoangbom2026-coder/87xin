export const getRandomDigit = () => {
    const a = new Date().valueOf().toString();
    return Number(a.slice(a.length - 1 - 7, a.length - 1));
};

export const getAccessIpaddress = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ips = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
    const ip = ips && ips.length > 0 && ips.indexOf(',') ? ips.split(',')[0] : null;
    return ip;
};

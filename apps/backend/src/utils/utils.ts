export const getUniqueName = (name: string) => {
    if (name.length === 7) {
        return name;
    } else if (name.length > 7) {
        return name.slice(0, 7);
    } else {
        const digit = 7 - name.length;
        const random = Math.floor(Math.random() * Math.pow(10, digit));
        return `${name}${random}`;
    }
};

export const getUniqueArrayById = (array) => {
    // eslint-disable-next-line
    return Array.from(new Set(array.map((item: any) => item.id))).map((id) => {
        // eslint-disable-next-line
        return array.find((item: any) => item.id === id);
    });
};

// Function to check if a point is inside a polygon
export const isPointInsidePolygon = (point, polygon) => {
    const x = Number(point[0]),
        y = Number(point[1]);
    let isInside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0],
            yi = polygon[i][1];
        const xj = polygon[j][0],
            yj = polygon[j][1];

        const intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersect) isInside = !isInside;
    }

    return isInside;
};

export const generateOTP = () => {
    return String(Math.floor(Math.random() * 1000000));
};

// eslint-disable-next-line
export const getIpAddress = (request: any) => {
    const getIP =
        request.headers['x-forwarded-for'] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.connection.socket.remoteAddress;
    return getIP.split(',')[0];
};

export const generateReferral = (leng: number = 6, upper: boolean = true): string => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const lowCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    const string = upper ? characters : lowCharacters;
    let result = '';

    for (let i = 0; i < leng; i++) {
        const randomIndex = Math.floor(Math.random() * string.length);
        result += string[randomIndex];
    }

    return result;
};

export const generateOtpCode = (): string => {
    const characters = '0123456789';
    let result = '';

    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }

    return result;
};

export const getMainCurrency = (code: string) => {
    return code.replace(/\d+$/, '');
};

export type ContactType = 'email' | 'phone' | 'invalid';

export function detectContactType(input: string): ContactType {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const phoneRegex = /^\+?\d{7,15}$/;

    if (emailRegex.test(input)) {
        return 'email';
    }

    if (phoneRegex.test(input)) {
        return 'phone';
    }

    return 'invalid';
}

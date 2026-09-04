import axios from 'axios';

export async function getGeoInfo(ip: string) {
    try {
        return await axios.get(`http://ip-api.com/json/${ip}`);
    } catch (error) {
        console.log('get country error');
        console.log((error as any).message);
        return {
            data: {
                countryCode: 'Unknown',
                country: 'Unknown'
            }
        };
    }
}

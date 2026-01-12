import { triggerSessionExpired } from '../../contexts/SessionContext';

const IS_DEV = import.meta.env.VITE_IS_DEV === '1' ? 1 : 0;

export async function callServicesApi(requestData) {
    try {
      const samp_body = {
                ...requestData,
                is_dev: IS_DEV
            }
      // console.log(samp_body);
        const response = await fetch('https://0oydlyiauf.execute-api.ap-south-1.amazonaws.com/default/wagnwonder-services', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(samp_body)
        });
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
  
      const responseBody = await response.json();
      console.log(response);
      
      // Check for session expired
      if (responseBody?.status_code === 498) {
        triggerSessionExpired();
        return responseBody;
      }
      
      return responseBody;
  
    } catch (error) {
      console.error("Error sending data with token:", error);
      return null;
    }
};


export async function verifyUser(data, token){
    const requestData = {
        ...data,
        token: token
    }
    let response = callServicesApi(requestData);
    return response;
}
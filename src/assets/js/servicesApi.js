export async function callServicesApi(requestData) {
    try {
      const response = await fetch('https://0oydlyiauf.execute-api.ap-south-1.amazonaws.com/default/wagnwonder-services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
  
      const responseBody = await response.json();
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

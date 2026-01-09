const IS_DEV = import.meta.env.VITE_IS_DEV === '1' ? 1 : 0;

export async function getTokenFromApi(inputJson) {
    // Add the new key-value to the input JSON
    const requestData = {
        ...inputJson,
        authorization_type: "GENERATE_TOKEN",
        is_dev: IS_DEV
    };
    try {
      // Call the API
      const response = await fetch('https://fjpkg7bibc.execute-api.ap-south-1.amazonaws.com/default/wagnwonder-authorizer', {
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
  
      // Return the token value
      return responseBody.token;
  
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };
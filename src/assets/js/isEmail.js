const isEmail =  (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export default isEmail;
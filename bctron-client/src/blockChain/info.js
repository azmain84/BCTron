export const DIM_X = 100;
export const DIM_Y = 100;
export const MIN_REWARD = 100;

let _address = undefined;

export const setAddress = (address) => {
    _address = address;
}

export const getAddress = () => {
    return _address;
}

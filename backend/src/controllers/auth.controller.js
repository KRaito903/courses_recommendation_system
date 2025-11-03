
const authControllers = {
    registerUser: (req, res) => {
        res.send('User registered successfully!');
    },
    loginUser: (req, res) => {
        res.send('User logged in successfully!');
    }
}

export const { registerUser, loginUser } = authControllers;
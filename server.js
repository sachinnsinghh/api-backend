const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/react-todo', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit the application if unable to connect to the database
    });

// Models
const Todo = require('./models/Todo');

// Middleware for handling async errors
const asyncMiddleware = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation middleware for checking if the request body has the required fields
const validateTodo = (req, res, next) => {
    if (!req.body.text) {
        return res.status(400).json({ error: 'Text field is required' });
    }
    next();
};

// Routes
app.get('/todos', asyncMiddleware(async (req, res) => {
    const todos = await Todo.find();
    res.json(todos);
}));

app.post('/todo/new', validateTodo, asyncMiddleware(async (req, res) => {
    const todo = new Todo({
        text: req.body.text,
    });

    await todo.save();

    res.json(todo);
}));

app.delete('/todo/delete/:id', asyncMiddleware(async (req, res) => {
    const result = await Todo.findByIdAndDelete(req.params.id);

    if (!result) {
        return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ result });
}));

app.get('/todo/complete/:id', asyncMiddleware(async (req, res) => {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
        return res.status(404).json({ error: 'Task not found' });
    }

    todo.complete = !todo.complete;
    await todo.save();

    res.json(todo);
}));

app.put('/todo/update/:id', validateTodo, asyncMiddleware(async (req, res) => {
    const todo = await Todo.findById(req.params.id);

    if (!todo) {
        return res.status(404).json({ error: 'Task not found' });
    }

    todo.text = req.body.text;
    await todo.save();

    res.json(todo);
}));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

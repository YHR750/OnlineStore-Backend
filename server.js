const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var routes = require('./routes');
routes(app);

app.use('/api/auth',authRoutes);
app.listen(3000, () => {
    console.log('Server started on port');
});
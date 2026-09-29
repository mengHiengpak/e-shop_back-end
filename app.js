const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const app = express();
const qs = require('qs')
const cookieParser = require('cookie-parser')
const categoryRoutes = require('./routes/category.route');
const customerRoutes = require('./routes/customer.route');
const supplyRoutes = require('./routes/supply.route');
const productRouter = require('./routes/product.route')
const { errorHandler } = require('./helper/error-handler');
const uploadRoute = require('./routes/upload.route');
const authRoute = require('./routes/auth.route');
const authGuard = require('./guards/auth.guard');
const userRoute = require('./routes/user.route');
const purchaseRoute = require('./routes/purchase.route');
const salesRoute = require('./routes/sales.route');
const reportsRoute = require('./routes/reports.route');
const SaleReportRouter = require('./routes/saleReport.route');
const stockReportsRoute = require('./routes/stockReports.route');
const rateLimit = require('express-rate-limit');
const customerAuthRoute = require('./routes/customer.authe.route');
const customerStore = require('./routes/cutomerStore.route');
const invoiceRoute = require('./routes/createInvoice.route');

//create cors for connect with axios 
const normalizeOrigin = (value) => (value || '').trim().replace(/^['"]|['"]$/g, '');

const allowedOrigins = [
  normalizeOrigin(process.env.LOCAL_DOMAIN),
  normalizeOrigin(process.env.LOCAL_DOMAINONE),
  'https://e-shop-dashboard.onrender.com',
  'https://e-shop-7g1h.onrender.com',
]
  .flatMap((value) => value.split(','))
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== 'production' ||
      process.env.CORS_ALLOW_ALL === 'true'
    ) {
      return callback(null, true);
    }

    console.warn(`[CORS] Blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());


const isNum = (n) => !isNaN(n) && String(n).trim() !== '';

app.set('query parser', (queryString) => {
    return qs.parse(queryString, {
        decoder: (value) => {
            const num = Number(value);
            return isNum(num) ? num : value;
        }
    })
})

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: {
        success: false,
        message: 'Too many requests, please try again later'
    }
})

if(process.env.NODE_ENV === 'production'){
    app.use(express.static('combined'));
} else{
    app.use(morgan('dev'));
}

app.use('/api/', limiter);
app.use('/api/categories', authGuard, categoryRoutes);
app.use('/api/customers',authGuard , customerRoutes);
app.use('/api/supplies', authGuard, supplyRoutes);
app.use('/api/upload', authGuard, uploadRoute)
app.use('/api/product', authGuard, productRouter)
app.use('/api/users', authGuard, userRoute)
app.use('/api/purchase',authGuard, purchaseRoute)
app.use('/api/sales',authGuard, salesRoute )
app.use('/api/reports', authGuard, reportsRoute)
app.use('/api/auth',authRoute)
app.use('/api/salereports', authGuard, SaleReportRouter)
app.use('/api/stockreports', authGuard, stockReportsRoute)
app.use('/api/uploads', express.static('upload'))


app.use('/api/customer', customerAuthRoute)
app.use('/api/customerstore', customerStore)
app.use('/api/invoices', invoiceRoute)

app.use(errorHandler);

module.exports = app;
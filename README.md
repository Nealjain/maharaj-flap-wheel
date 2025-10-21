# Maharj Flap Wheel - ERP Management System

A complete ERP web application built with Next.js, React, TypeScript, and Tailwind CSS for manufacturing company management.

## 🚀 Features

### Core Operations
- **Dashboard**: KPI cards, stock overview, quick actions
- **Orders Management**: Create, view, complete orders with stock reservation
- **Stock Management**: Real-time inventory tracking with status indicators
- **Master Data**: Items, companies, transport companies, units management

### User Management
- **Authentication**: Email/password login with session persistence
- **Role-based Access**: Admin and staff roles with different permissions
- **User Management**: Admin-only user creation and management

### Advanced Features
- **Dark/Light Theme**: Toggle stored in localStorage
- **Responsive Design**: Desktop, tablet, mobile optimized
- **CSV Export**: Orders and stock reports with filters
- **Audit Logging**: All actions logged for compliance
- **Real-time Updates**: Live stock calculations and order status

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Animations**: Framer Motion
- **Icons**: Heroicons
- **State Management**: React Context + Custom Hooks

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd maharj-flap-wheel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   Run the SQL schema from `supabase-schema.sql` in your Supabase dashboard:
   ```sql
   -- Copy and paste the contents of supabase-schema.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Schema

The application uses the following main tables:

- **users**: User authentication and profiles
- **companies**: Customer and supplier companies
- **transport_companies**: Logistics partners
- **items**: Product catalog with stock tracking
- **orders**: Order management with status tracking
- **order_items**: Order line items
- **audit_logs**: System activity logging
- **login_activities**: User login tracking

## 🎯 Key Features

### Dashboard
- Real-time KPIs (Total Orders, Today's Orders, Pending, Completed)
- Stock overview (Out of Stock, Low Stock, Over Stock, Total Items)
- Quick action buttons for common tasks
- Health status alerts

### Orders Management
- Create orders with company and item selection
- Automatic stock reservation on order creation
- Order status tracking (Reserved, Completed, Cancelled)
- Admin-only order completion
- CSV export with filters

### Stock Management
- Real-time stock levels (Physical, Reserved, Available)
- Stock status indicators (Out of Stock, Low Stock, Normal, Over Stock)
- Inline stock editing
- Stock alerts and notifications

### Master Data
- **Items**: SKU, name, description, unit, stock levels
- **Companies**: Name, address, GST number
- **Transport Companies**: Logistics partners with contact info
- **Units**: Measurement units (pcs, kg, m, L, etc.)

### User Management (Admin Only)
- User creation and role assignment
- Role-based access control
- User activity tracking

### Settings
- Theme toggle (Dark/Light mode)
- Admin tools for data management
- Session management

## 🔐 Security Features

- **Role-based Access Control**: Admin and staff permissions
- **Audit Logging**: All actions logged with user and timestamp
- **Session Management**: Secure authentication with Supabase
- **Data Validation**: Form validation and error handling
- **CSRF Protection**: Built-in Next.js security features

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Responsive grid layouts
- **Desktop**: Full-featured desktop experience
- **Touch Friendly**: Mobile-optimized interactions

## 🎨 Theme System

- **Dark Mode**: Professional dark theme
- **Light Mode**: Clean light theme
- **System Preference**: Respects user's system preference
- **Persistent**: Theme choice saved in localStorage

## 📊 Reporting & Export

- **CSV Export**: Orders and stock data with filters
- **Real-time Data**: Live updates without page refresh
- **Filtered Exports**: Export only relevant data
- **Timestamped Files**: Automatic file naming with dates

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Static site deployment
- **Railway**: Full-stack deployment
- **DigitalOcean**: VPS deployment

## 🔧 Development

### Project Structure
```
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── orders/            # Orders management
│   ├── stock/             # Stock management
│   ├── masters/           # Master data management
│   ├── users/             # User management (admin)
│   ├── settings/          # Settings page
│   └── api/               # API routes
├── components/            # Reusable components
├── lib/                   # Utilities and providers
└── public/               # Static assets
```

### Key Components
- **Layout**: Main application layout with navigation
- **KPICard**: Dashboard metric cards
- **CSVExport**: Export functionality
- **ConfirmDialog**: Confirmation dialogs
- **Navigation**: Responsive navigation with theme toggle

### Custom Hooks
- **useAuth**: Authentication state management
- **useData**: Data fetching and state management
- **useTheme**: Theme management

## 📈 Performance

- **Server-Side Rendering**: Fast initial page loads
- **Client-Side Navigation**: Smooth page transitions
- **Optimized Images**: Next.js image optimization
- **Code Splitting**: Automatic code splitting
- **Caching**: Supabase query caching

## 🧪 Testing

The application is built with production-ready code and includes:
- Type safety with TypeScript
- Error boundaries for graceful error handling
- Form validation
- Input sanitization
- Responsive design testing

## 📝 License

This project is proprietary software for Maharj Flap Wheel Company.

## 🤝 Support

For support and questions, please contact the development team.

---

**Built with ❤️ for Maharj Flap Wheel Company**
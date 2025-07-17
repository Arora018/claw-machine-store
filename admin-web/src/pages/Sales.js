import React, { useState, useEffect } from 'react';
import {
  Typography, Paper, Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Card, CardContent, Grid, Alert, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, List, ListItem,
  ListItemText, Divider
} from '@mui/material';
import { Download, DateRange } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, isWithinInterval, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import api from '../services/api';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalSales, setTotalSales] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  
  // Date range export states
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filter sales based on date range
    if (startDate && endDate) {
      const filtered = sales.filter(sale => {
        const saleDate = parseISO(sale.createdAt);
        return isWithinInterval(saleDate, { start: startDate, end: endDate });
      });
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  }, [sales, startDate, endDate]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/sales');
      setSales(response.data.sales || []);
      calculateTotals(response.data.sales || []);
    } catch (error) {
      console.error('Failed to fetch sales:', error);
      setError('Failed to load sales data. Using demo data.');
      
      // Demo data when API fails
      const demoSales = [
        {
          _id: '1',
          saleNumber: 'SALE-000001',
          items: [
            { product: '1', quantity: 2 },
            { product: '4', quantity: 1 }
          ],
          total: 450,
          paymentMethod: 'cash',
          createdAt: new Date().toISOString(),
          cashier: { username: 'admin' }
        },
        {
          _id: '2',
          saleNumber: 'SALE-000002',
          items: [
            { product: '2', quantity: 1 }
          ],
          total: 500,
          paymentMethod: 'upi',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          cashier: { username: 'admin' }
        },
        {
          _id: '3',
          saleNumber: 'SALE-000003',
          items: [
            { product: '3', quantity: 1 },
            { product: '5', quantity: 1 }
          ],
          total: 1400,
          paymentMethod: 'card',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          cashier: { username: 'admin' }
        }
      ];
      setSales(demoSales);
      calculateTotals(demoSales);
    }
    setLoading(false);
  };

  const calculateTotals = (salesData) => {
    const total = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
    setTotalSales(total);

    const today = new Date().toDateString();
    const todayTotal = salesData
      .filter(sale => new Date(sale.createdAt).toDateString() === today)
      .reduce((sum, sale) => sum + (sale.total || 0), 0);
    setTodaySales(todayTotal);
  };

  const getProductDetails = (productData) => {
    // If productData is already a populated object with name and price
    if (typeof productData === 'object' && productData.name && productData.price !== undefined) {
      return {
        name: productData.name,
        price: productData.price
      };
    }
    
    // If productData is just an ID, look it up in products array
    const productId = typeof productData === 'object' ? productData._id : productData;
    const product = products.find(p => p._id === productId || p._id === String(productId));
    if (product) {
      return {
        name: product.name,
        price: product.price
      };
    }
    
    // Fallback for demo data or when product not found
    const fallbackProducts = {
      '1': { name: '1 Coin', price: 100 },
      '2': { name: '7 Coins', price: 500 },
      '3': { name: '15 Coins', price: 1000 },
      '4': { name: 'Teddy Bear', price: 250 },
      '5': { name: 'Action Figure', price: 400 },
      '6': { name: 'Doll', price: 350 },
      '7': { name: 'Car Toy', price: 300 }
    };
    
    return fallbackProducts[productId] || { name: `Unknown Product (${productId})`, price: 0 };
  };

  const handleExportDialogOpen = () => {
    setExportDialogOpen(true);
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    setStartDate(thirtyDaysAgo);
    setEndDate(today);
  };

  const handleExportDialogClose = () => {
    setExportDialogOpen(false);
    setStartDate(null);
    setEndDate(null);
  };

  const exportToExcel = () => {
    try {
      // Use filtered sales or all sales
      const dataToExport = (startDate && endDate) ? filteredSales : sales;
      
      if (dataToExport.length === 0) {
        alert('No sales data found for the selected date range.');
        return;
      }

      // Prepare data for Excel export
      const exportData = dataToExport.map((sale, index) => {
        const itemsText = sale.items.map(item => {
          const productDetails = getProductDetails(item.product);
          return `${productDetails.name} x${item.quantity} (₹${productDetails.price * item.quantity})`;
        }).join(', ');

        return {
          'Sr. No.': index + 1,
          'Sale Number': sale.saleNumber || `SALE-${sale._id}`,
          'Date': format(new Date(sale.createdAt), 'dd/MM/yyyy'),
          'Time': format(new Date(sale.createdAt), 'HH:mm:ss'),
          'Items': itemsText,
          'Payment Method': sale.paymentMethod?.toUpperCase() || 'CASH',
          'Staff': sale.cashier?.username || 'admin',
          'Total Amount (₹)': sale.total
        };
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 8 },  // Sr. No.
        { wch: 15 }, // Sale Number
        { wch: 12 }, // Date
        { wch: 10 }, // Time
        { wch: 50 }, // Items (increased width)
        { wch: 15 }, // Payment Method
        { wch: 10 }, // Staff
        { wch: 15 }  // Total Amount
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Data');

      // Generate filename with current date and range
      const dateRange = startDate && endDate 
        ? `_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}`
        : '';
      const filename = `sales_data${dateRange}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);

      alert(`Sales data exported successfully as ${filename}`);
      handleExportDialogClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export sales data. Please try again.');
    }
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      'cash': 'success',
      'upi': 'warning',
      'card': 'secondary'
    };
    return colors[method] || 'default';
  };

  const renderItemsCell = (items) => {
    return (
      <Box sx={{ maxWidth: 300 }}>
        <List dense disablePadding>
          {items.map((item, index) => {
            const productDetails = getProductDetails(item.product);
            const itemTotal = productDetails.price * item.quantity;
            
            return (
              <ListItem key={index} disablePadding sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="body2" fontWeight="bold">
                        {productDetails.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        x{item.quantity}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      ₹{productDetails.price} each = ₹{itemTotal}
                    </Typography>
                  }
                />
                {index < items.length - 1 && <Divider />}
              </ListItem>
            );
          })}
        </List>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Sales History</Typography>
        <Paper sx={{ p: 3 }}>
          <Typography>Loading sales data...</Typography>
        </Paper>
      </Box>
    );
  }

  const displaySales = (startDate && endDate) ? filteredSales : sales;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4">Sales History</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DateRange />}
            onClick={handleExportDialogOpen}
            disabled={sales.length === 0}
          >
            Export with Date Range
          </Button>
        </Box>
        
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {(startDate && endDate) && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Showing sales from {format(startDate, 'dd/MM/yyyy')} to {format(endDate, 'dd/MM/yyyy')} 
            ({displaySales.length} transactions)
            <Button size="small" onClick={() => { setStartDate(null); setEndDate(null); }} sx={{ ml: 1 }}>
              Clear Filter
            </Button>
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Today's Sales
                </Typography>
                <Typography variant="h4">
                  ₹{todaySales.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Total Sales
                </Typography>
                <Typography variant="h4">
                  ₹{totalSales.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  Total Transactions
                </Typography>
                <Typography variant="h4">
                  {displaySales.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sale Number</TableCell>
                <TableCell>Date & Time</TableCell>
                <TableCell sx={{ minWidth: 300 }}>Items</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Staff</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displaySales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      No sales data available. Make a sale in the POS to see data here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displaySales.map((sale) => (
                  <TableRow key={sale._id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {sale.saleNumber || `SALE-${sale._id}`}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {renderItemsCell(sale.items)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sale.paymentMethod?.toUpperCase() || 'CASH'}
                        color={getPaymentMethodColor(sale.paymentMethod)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {sale.cashier?.username || 'admin'}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="h6" color="primary">
                        ₹{sale.total.toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {displaySales.length > 0 && (
          <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="textSecondary">
              Showing {displaySales.length} transaction(s)
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Download />}
              onClick={() => exportToExcel()}
            >
              Export Current View
            </Button>
          </Box>
        )}

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={handleExportDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>Export Sales Data</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Select date range to export sales data. Leave empty to export all data.
              </Typography>
              
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Select the start date for export'
                  }
                }}
              />
              
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Select the end date for export'
                  }
                }}
              />

              {startDate && endDate && (
                <Alert severity="info">
                  {filteredSales.length} transactions found in the selected date range.
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleExportDialogClose}>Cancel</Button>
            <Button 
              onClick={exportToExcel} 
              variant="contained" 
              startIcon={<Download />}
              disabled={startDate && endDate && filteredSales.length === 0}
            >
              Export Excel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default Sales;

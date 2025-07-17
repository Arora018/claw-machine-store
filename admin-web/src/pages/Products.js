import React, { useState, useEffect } from 'react';
import {
  Typography, Paper, Box, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, Card, CardContent, CardActions,
  Select, MenuItem, FormControl, InputLabel, Chip, Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'coins'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    { value: 'coins', label: 'Coins' },
    { value: 'plush_toy', label: 'Plush Toy' },
    { value: 'figurine', label: 'Figurine' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'candy', label: 'Candy' },
    { value: 'other', label: 'Other' }
  ];

  const defaultProducts = [
    { _id: '1', name: '1 Coin', price: 100, category: 'coins' },
    { _id: '2', name: '7 Coins', price: 500, category: 'coins' },
    { _id: '3', name: '15 Coins', price: 1000, category: 'coins' },
    { _id: '4', name: 'Teddy Bear', price: 299, category: 'plush_toy' },
    { _id: '5', name: 'Action Figure', price: 250, category: 'figurine' },
    { _id: '6', name: 'Mini Robot', price: 199, category: 'electronics' },
    { _id: '7', name: 'Candy Pack', price: 99, category: 'candy' },
    { _id: '8', name: 'Unicorn Plush', price: 399, category: 'plush_toy' },
    { _id: '9', name: 'Superhero Figure', price: 349, category: 'figurine' }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        // Fallback to default products
        setProducts(defaultProducts);
      }
    } catch (error) {
      console.log('Using default products');
      setProducts(defaultProducts);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        category: 'coins'
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      category: 'coins'
    });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      setError('Please fill in all fields');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    const productData = {
      name: formData.name,
      price: price,
      category: formData.category,
      description: `${formData.name} - ${formData.category.replace('_', ' ')}`
    };

    try {
      let response;
      if (editingProduct) {
        response = await fetch(`http://localhost:3000/api/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });
      } else {
        response = await fetch('http://localhost:3000/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(productData)
        });
      }

      if (response.ok) {
        setSuccess(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
        await fetchProducts();
        handleCloseDialog();
      } else {
        setError('Failed to save product');
      }
    } catch (error) {
      // Demo mode - add to local state
      if (editingProduct) {
        setProducts(prev => prev.map(p => 
          p._id === editingProduct._id 
            ? { ...editingProduct, ...productData }
            : p
        ));
        setSuccess('Product updated successfully! (Demo mode)');
      } else {
        const newProduct = {
          _id: Date.now().toString(),
          ...productData
        };
        setProducts(prev => [...prev, newProduct]);
        setSuccess('Product added successfully! (Demo mode)');
      }
      handleCloseDialog();
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Product deleted successfully!');
        await fetchProducts();
      } else {
        setError('Failed to delete product');
      }
    } catch (error) {
      // Demo mode - remove from local state
      setProducts(prev => prev.filter(p => p._id !== productId));
      setSuccess('Product deleted successfully! (Demo mode)');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      coins: 'primary',
      plush_toy: 'secondary',
      figurine: 'success',
      electronics: 'info',
      candy: 'warning',
      other: 'default'
    };
    return colors[category] || 'default';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Products Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Product
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {product.name}
                </Typography>
                <Typography variant="h5" color="primary" gutterBottom>
                  ₹{product.price}
                </Typography>
                <Chip
                  label={product.category.replace('_', ' ')}
                  color={getCategoryColor(product.category)}
                  size="small"
                />
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog(product)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDelete(product._id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Price (₹)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              margin="normal"
              required
              inputProps={{ min: 1 }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    {category.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingProduct ? 'Update' : 'Add'} Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;

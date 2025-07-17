import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Alert, FlatList } from 'react-native';
import { 
  Provider as PaperProvider, 
  Appbar, 
  Card, 
  Title, 
  Button, 
  Text, 
  DataTable,
  TextInput,
  Portal,
  Dialog,
  List,
  Chip,
  Surface,
  ActivityIndicator,
  Snackbar
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

const { width, height } = Dimensions.get('window');

// Cloud API Configuration - UPDATE THIS TO YOUR CLOUD URL
const CLOUD_API_URL = 'https://your-railway-app-name.railway.app/api'; // UPDATE WITH YOUR RAILWAY URL!
const LOCAL_API_URL = 'http://localhost:3000/api'; // Fallback for development

class OfflineDatabase {
  constructor() {
    this.db = null;
    this.init();
  }

  async init() {
    this.db = await SQLite.openDatabaseAsync('clawstore.db');
    await this.createTables();
  }

  async createTables() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        token TEXT,
        role TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        category TEXT,
        isActive INTEGER DEFAULT 1,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        clientId TEXT UNIQUE,
        items TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        total INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        cashier TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS machines (
        id TEXT PRIMARY KEY,
        machineId TEXT,
        name TEXT,
        location TEXT,
        status TEXT,
        coinCount INTEGER,
        currentToyCount INTEGER,
        maxCapacity INTEGER,
        synced INTEGER DEFAULT 0
      );
    `);
  }

  async getProducts() {
    const result = await this.db.getAllAsync('SELECT * FROM products WHERE isActive = 1');
    return result;
  }

  async saveProducts(products) {
    for (const product of products) {
      await this.db.runAsync(
        'INSERT OR REPLACE INTO products (id, name, price, category, isActive, synced) VALUES (?, ?, ?, ?, ?, ?)',
        [product._id || product.id, product.name, product.price, product.category, 1, 1]
      );
    }
  }

  async saveSale(sale) {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO sales (id, clientId, items, paymentMethod, total, timestamp, cashier, synced) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [sale.id, sale.clientId, JSON.stringify(sale.items), sale.paymentMethod, sale.total, sale.timestamp, sale.cashier || 'admin', 0]
    );
  }

  async getUnsyncedSales() {
    const result = await this.db.getAllAsync('SELECT * FROM sales WHERE synced = 0');
    return result.map(sale => ({
      ...sale,
      items: JSON.parse(sale.items)
    }));
  }

  async markSalesAsSynced(salesIds) {
    for (const id of salesIds) {
      await this.db.runAsync('UPDATE sales SET synced = 1 WHERE id = ?', [id]);
    }
  }

  async getSalesCount() {
    const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM sales');
    return result.count;
  }

  async saveUser(user) {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO users (id, username, token, role) VALUES (?, ?, ?, ?)',
      [user.id, user.username, user.token, user.role]
    );
  }

  async getUser() {
    return await this.db.getFirstAsync('SELECT * FROM users LIMIT 1');
  }

  async clearUser() {
    await this.db.runAsync('DELETE FROM users');
  }
}

export default function App() {
  const [db] = useState(new OfflineDatabase());
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSalesCount, setPendingSalesCount] = useState(0);
  const [showLogin, setShowLogin] = useState(true);
  const [showInventory, setShowInventory] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: 'admin123' });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const api = axios.create({
    baseURL: CLOUD_API_URL,
    timeout: 10000,
  });

  useEffect(() => {
    initializeApp();
    setupNetworkListener();
  }, []);

  useEffect(() => {
    calculateTotal();
  }, [cart]);

  useEffect(() => {
    if (isOnline && user) {
      syncData();
    }
  }, [isOnline, user]);

  const initializeApp = async () => {
    try {
      // Wait for database to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to restore user session
      const savedUser = await db.getUser();
      if (savedUser) {
        setUser(savedUser);
        setShowLogin(false);
        api.defaults.headers.common['Authorization'] = `Bearer ${savedUser.token}`;
      }

      // Load cached products
      const cachedProducts = await db.getProducts();
      if (cachedProducts.length > 0) {
        setProducts(cachedProducts);
      } else {
        // Load default products if no cache
        await loadDefaultProducts();
      }

      // Get pending sales count
      const count = await db.getSalesCount();
      setPendingSalesCount(count);

      setLoading(false);
    } catch (error) {
      console.error('App initialization error:', error);
      await loadDefaultProducts();
      setLoading(false);
    }
  };

  const loadDefaultProducts = async () => {
    const defaultProducts = [
      { id: '1', name: '1 Coin', price: 100, category: 'coins' },
      { id: '2', name: '7 Coins', price: 500, category: 'coins' },
      { id: '3', name: '15 Coins', price: 1000, category: 'coins' },
      { id: '4', name: 'Teddy Bear', price: 250, category: 'plush_toy' },
      { id: '5', name: 'Pokemon Figure', price: 400, category: 'figurine' },
      { id: '6', name: 'Hello Kitty Plush', price: 350, category: 'plush_toy' },
      { id: '7', name: 'Gummy Bears', price: 80, category: 'candy' }
    ];
    setProducts(defaultProducts);
    await db.saveProducts(defaultProducts);
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = isOnline;
      const nowOnline = state.isConnected && state.isInternetReachable;
      setIsOnline(nowOnline);
      
      if (!wasOnline && nowOnline) {
        showSnackbar('🟢 Back online - syncing data...');
      } else if (wasOnline && !nowOnline) {
        showSnackbar('🔴 Offline mode - data will sync when connected');
      }
    });

    return unsubscribe;
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const login = async () => {
    try {
      setLoading(true);
      let response;
      
      try {
        // Try cloud API first
        response = await api.post('/auth/login', loginForm);
      } catch (error) {
        // Fallback to local API
        const localApi = axios.create({ baseURL: LOCAL_API_URL, timeout: 5000 });
        response = await localApi.post('/auth/login', loginForm);
      }

      const { token, user: userData } = response.data;
      
      const userWithToken = { ...userData, token };
      setUser(userWithToken);
      await db.saveUser(userWithToken);
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setShowLogin(false);
      showSnackbar('✅ Login successful!');
      
      // Fetch fresh data if online
      if (isOnline) {
        await fetchCloudData();
      }
    } catch (error) {
      // Demo mode for offline testing
      if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
        const demoUser = { id: 'demo', username: 'admin', role: 'admin', token: 'demo-token' };
        setUser(demoUser);
        await db.saveUser(demoUser);
        setShowLogin(false);
        showSnackbar('🔄 Offline login successful!');
      } else {
        Alert.alert('Error', 'Invalid credentials or connection failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCloudData = async () => {
    try {
      const [productsResponse] = await Promise.all([
        api.get('/products')
      ]);

      if (productsResponse.data.products) {
        setProducts(productsResponse.data.products);
        await db.saveProducts(productsResponse.data.products);
      }
    } catch (error) {
      console.log('Failed to fetch cloud data:', error.message);
    }
  };

  const syncData = async () => {
    if (!isOnline || isSyncing) return;

    try {
      setIsSyncing(true);
      
      // Upload pending sales
      const unsyncedSales = await db.getUnsyncedSales();
      if (unsyncedSales.length > 0) {
        const response = await api.post('/sync/sales/bulk', { sales: unsyncedSales });
        if (response.status === 200) {
          await db.markSalesAsSynced(unsyncedSales.map(s => s.id));
          const newCount = await db.getSalesCount();
          setPendingSalesCount(newCount);
          showSnackbar(`✅ Synced ${unsyncedSales.length} sales to cloud`);
        }
      }

      // Fetch fresh data
      await fetchCloudData();
    } catch (error) {
      console.log('Sync failed:', error.message);
      showSnackbar('⚠️ Sync failed - will retry when connection improves');
    } finally {
      setIsSyncing(false);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    setTotal(subtotal);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    Alert.alert(
      'Confirm Sale',
      `Process sale for ₹${total} via ${selectedPaymentMethod.toUpperCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: async () => {
          try {
            const sale = {
              id: uuidv4(),
              clientId: uuidv4(),
              items: cart.map(item => ({
                product: item.product.id,
                quantity: item.quantity
              })),
              paymentMethod: selectedPaymentMethod,
              total: total,
              timestamp: new Date().toISOString(),
              cashier: user?.username || 'admin'
            };

            // Save to local database first
            await db.saveSale(sale);
            
            // Try to sync immediately if online
            if (isOnline) {
              try {
                await api.post('/sales', sale);
                await db.markSalesAsSynced([sale.id]);
                showSnackbar(`✅ Sale completed and synced to cloud!`);
              } catch (error) {
                showSnackbar(`💾 Sale saved locally - will sync when connected`);
              }
            } else {
              showSnackbar(`💾 Sale saved offline - will sync when connected`);
            }

            const newCount = await db.getSalesCount();
            setPendingSalesCount(newCount);
            
            setCart([]);
            setTotal(0);
            setSelectedPaymentMethod('cash');
          } catch (error) {
            Alert.alert('Error', 'Failed to process sale');
          }
        }}
      ]
    );
  };

  const logout = async () => {
    await db.clearUser();
    setUser(null);
    setShowLogin(true);
    setCart([]);
    setSelectedPaymentMethod('cash');
    api.defaults.headers.common['Authorization'] = '';
  };

  const getConnectionStatus = () => {
    if (isSyncing) return { text: 'Syncing...', color: '#2196F3' };
    if (isOnline) return { text: 'Online', color: '#4CAF50' };
    return { text: 'Offline', color: '#FF9800' };
  };

  if (loading) {
    return (
      <PaperProvider>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 16 }}>Loading...</Text>
        </View>
      </PaperProvider>
    );
  }

  if (showLogin) {
    return (
      <PaperProvider>
        <View style={styles.container}>
          <StatusBar style="auto" />
          <View style={styles.loginContainer}>
            <Title style={styles.title}>Claw Machine Store</Title>
            <Text style={styles.subtitle}>Offline POS System</Text>
            
            <TextInput
              label="Username"
              value={loginForm.username}
              onChangeText={(text) => setLoginForm({...loginForm, username: text})}
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              label="Password"
              value={loginForm.password}
              onChangeText={(text) => setLoginForm({...loginForm, password: text})}
              secureTextEntry
              style={styles.input}
            />
            <Button mode="contained" onPress={login} style={styles.button} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <Text style={styles.hint}>
              Default: admin / admin123 (works offline)
            </Text>
          </View>
        </View>
      </PaperProvider>
    );
  }

  if (showInventory) {
    return (
      <PaperProvider>
        <View style={styles.container}>
          <Appbar.Header>
            <Appbar.Content title="Inventory" />
            <Appbar.Action icon="point-of-sale" onPress={() => setShowInventory(false)} />
            <Appbar.Action icon="logout" onPress={logout} />
          </Appbar.Header>
          
          <ScrollView style={styles.content}>
            <View style={styles.statusBar}>
              <Chip mode="outlined" icon="wifi" style={{ backgroundColor: getConnectionStatus().color }}>
                {getConnectionStatus().text}
              </Chip>
              {pendingSalesCount > 0 && (
                <Chip mode="outlined" icon="database" style={{ backgroundColor: '#FF5722' }}>
                  {pendingSalesCount} pending
                </Chip>
              )}
            </View>

            <Title>Products ({products.length})</Title>
            {products.map(product => (
              <List.Item
                key={product.id || product._id}
                title={product.name}
                description={`₹${product.price} - ${product.category?.replace('_', ' ')}`}
                left={props => <List.Icon {...props} icon="package-variant" />}
              />
            ))}
          </ScrollView>
        </View>
      </PaperProvider>
    );
  }

  const status = getConnectionStatus();

  return (
    <PaperProvider>
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Appbar.Header>
          <Appbar.Content title={`POS - ${user?.username}`} />
          <View style={styles.headerStatus}>
            <Chip mode="outlined" icon="wifi" style={{ backgroundColor: status.color, marginRight: 8 }}>
              {status.text}
            </Chip>
            {pendingSalesCount > 0 && (
              <Chip mode="outlined" icon="database" style={{ backgroundColor: '#FF5722', marginRight: 8 }}>
                {pendingSalesCount}
              </Chip>
            )}
          </View>
          <Appbar.Action icon="warehouse" onPress={() => setShowInventory(true)} />
          <Appbar.Action icon="logout" onPress={logout} />
        </Appbar.Header>

        <View style={styles.mainContent}>
          {/* Products Section */}
          <View style={styles.productsSection}>
            <Title>Products</Title>
            {!isOnline && (
              <Text style={styles.offlineNotice}>📱 Working offline - using cached data</Text>
            )}
            <FlatList
              data={products}
              numColumns={2}
              renderItem={({ item }) => (
                <Card style={styles.productCard} onPress={() => addToCart(item)}>
                  <Card.Content>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productPrice}>₹{item.price}</Text>
                    <Text style={styles.productCategory}>{item.category?.replace('_', ' ')}</Text>
                  </Card.Content>
                </Card>
              )}
              keyExtractor={(item) => item.id || item._id}
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Cart Section */}
          <View style={styles.cartSection}>
            <Title>Cart ({cart.length})</Title>
            <ScrollView style={styles.cartItems}>
              {cart.map(item => (
                <Surface key={item.product.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.product.name}</Text>
                    <Text style={styles.cartItemPrice}>₹{item.product.price} × {item.quantity} = ₹{item.product.price * item.quantity}</Text>
                  </View>
                  <View style={styles.cartItemActions}>
                    <Button mode="outlined" onPress={() => updateQuantity(item.product.id, -1)} compact>-</Button>
                    <Text style={styles.quantity}>{item.quantity}</Text>
                    <Button mode="outlined" onPress={() => updateQuantity(item.product.id, 1)} compact>+</Button>
                    <Button mode="text" onPress={() => removeFromCart(item.product.id)} compact textColor="#F44336">×</Button>
                  </View>
                </Surface>
              ))}
            </ScrollView>

            <View style={styles.cartFooter}>
              <Text style={styles.total}>Total: ₹{total}</Text>
              
              <View style={styles.paymentMethods}>
                {['cash', 'upi', 'card'].map(method => (
                  <Button
                    key={method}
                    mode={selectedPaymentMethod === method ? 'contained' : 'outlined'}
                    onPress={() => setSelectedPaymentMethod(method)}
                    style={styles.paymentButton}
                    compact
                  >
                    {method.toUpperCase()}
                  </Button>
                ))}
              </View>

              <Button 
                mode="contained" 
                onPress={processSale} 
                disabled={cart.length === 0}
                style={styles.checkoutButton}
              >
                Process Sale ({selectedPaymentMethod.toUpperCase()})
              </Button>
            </View>
          </View>
        </View>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
    color: '#1976d2',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  hint: {
    textAlign: 'center',
    marginTop: 16,
    color: '#666',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  productsSection: {
    flex: 2,
    padding: 16,
  },
  cartSection: {
    flex: 1,
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  productCard: {
    flex: 1,
    margin: 4,
    minHeight: 120,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  cartItems: {
    flex: 1,
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    elevation: 1,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#666',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#1976d2',
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  paymentButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  checkoutButton: {
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  offlineNotice: {
    backgroundColor: '#ff9800',
    color: 'white',
    padding: 8,
    borderRadius: 4,
    textAlign: 'center',
    marginBottom: 16,
  },
});

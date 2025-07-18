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
  Snackbar,
  Menu,
  Divider
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

const { width, height } = Dimensions.get('window');

// Detect if device is tablet or phone
const isTablet = width >= 768;

// Cloud API Configuration
const CLOUD_API_URL = 'https://claw-machine-backend.onrender.com/api';
const LOCAL_API_URL = 'http://localhost:3000/api';

// Predefined store configurations (can be expanded)
const STORE_CONFIGS = [
  {
    id: 'yanoi-main',
    name: 'Yanoi Main Store',
    location: 'Main Location',
    apiUrl: CLOUD_API_URL,
    defaultUsername: 'admin'
  },
  {
    id: 'yanoi-branch1',
    name: 'Yanoi Branch 1',
    location: 'Branch Location 1',
    apiUrl: CLOUD_API_URL,
    defaultUsername: 'admin'
  },
  {
    id: 'yanoi-branch2',
    name: 'Yanoi Branch 2',
    location: 'Branch Location 2',
    apiUrl: CLOUD_API_URL,
    defaultUsername: 'admin'
  },
  {
    id: 'custom',
    name: 'Custom Store',
    location: 'Custom Location',
    apiUrl: CLOUD_API_URL,
    defaultUsername: ''
  }
];

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
        role TEXT,
        storeId TEXT
      );

      CREATE TABLE IF NOT EXISTS stores (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        apiUrl TEXT,
        lastUsed INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        category TEXT,
        isActive INTEGER DEFAULT 1,
        synced INTEGER DEFAULT 0,
        storeId TEXT
      );

      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        clientId TEXT UNIQUE,
        items TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        total INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        cashier TEXT,
        synced INTEGER DEFAULT 0,
        storeId TEXT
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
        synced INTEGER DEFAULT 0,
        storeId TEXT
      );
    `);
  }

  // Store management methods
  async saveStore(store) {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO stores (id, name, location, apiUrl, lastUsed) VALUES (?, ?, ?, ?, ?)',
      [store.id, store.name, store.location, store.apiUrl, Date.now()]
    );
  }

  async getStores() {
    const result = await this.db.getAllAsync('SELECT * FROM stores ORDER BY lastUsed DESC');
    return result;
  }

  async getLastUsedStore() {
    const result = await this.db.getFirstAsync('SELECT * FROM stores ORDER BY lastUsed DESC LIMIT 1');
    return result;
  }

  async saveUser(user) {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO users (id, username, token, role, storeId) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.username, user.token, user.role, user.storeId || '']
    );
  }

  async getUser() {
    const result = await this.db.getFirstAsync('SELECT * FROM users LIMIT 1');
    return result;
  }

  async saveProducts(products, storeId) {
    for (const product of products) {
      await this.db.runAsync(
        'INSERT OR REPLACE INTO products (id, name, price, category, isActive, storeId) VALUES (?, ?, ?, ?, ?, ?)',
        [product.id, product.name, product.price, product.category, product.isActive ? 1 : 0, storeId]
      );
    }
  }

  async getProducts(storeId) {
    const result = await this.db.getAllAsync(
      'SELECT * FROM products WHERE storeId = ? AND isActive = 1', 
      [storeId]
    );
    return result;
  }

  async saveSale(sale, storeId) {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO sales (id, clientId, items, paymentMethod, total, timestamp, cashier, storeId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [sale.id, sale.clientId, JSON.stringify(sale.items), sale.paymentMethod, sale.total, sale.timestamp, sale.cashier, storeId]
    );
  }

  async getPendingSales(storeId) {
    const result = await this.db.getAllAsync(
      'SELECT * FROM sales WHERE synced = 0 AND storeId = ?', 
      [storeId]
    );
    return result.map(sale => ({
      ...sale,
      items: JSON.parse(sale.items)
    }));
  }

  async markSaleSynced(id) {
    await this.db.runAsync('UPDATE sales SET synced = 1 WHERE id = ?', [id]);
  }

  async getSalesCount() {
    const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM sales');
    return result.count;
  }

  async clearUserData() {
    await this.db.runAsync('DELETE FROM users');
  }
}

export default function App() {
  // State management
  const [showLogin, setShowLogin] = useState(true);
  const [showStoreSelection, setShowStoreSelection] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [customStoreForm, setCustomStoreForm] = useState({ name: '', location: '', apiUrl: CLOUD_API_URL });
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [storeMenuVisible, setStoreMenuVisible] = useState(false);
  const [showCustomStoreDialog, setShowCustomStoreDialog] = useState(false);

  // Database and API instances
  const [db] = useState(() => new OfflineDatabase());
  const [api] = useState(() => axios.create({ baseURL: CLOUD_API_URL }));
  const [localApi] = useState(() => axios.create({ baseURL: LOCAL_API_URL }));

  // Check for saved user and store on app start
  useEffect(() => {
    checkSavedSession();
    checkNetworkStatus();
  }, []);

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      if (state.isConnected && selectedStore) {
        syncData();
      }
    });
    return unsubscribe;
  }, [selectedStore]);

  const checkSavedSession = async () => {
    try {
      const savedUser = await db.getUser();
      const lastStore = await db.getLastUsedStore();
      
      if (savedUser && savedUser.token && lastStore) {
        setCurrentUser(savedUser);
        setSelectedStore(lastStore);
        setShowLogin(false);
        setShowStoreSelection(false);
        
        // Set up API with saved token
        api.defaults.baseURL = lastStore.apiUrl;
        api.defaults.headers.common['Authorization'] = `Bearer ${savedUser.token}`;
        
        loadProducts();
      } else if (lastStore) {
        setSelectedStore(lastStore);
        setShowStoreSelection(false);
        setLoginForm({ ...loginForm, username: lastStore.defaultUsername || '' });
      } else {
        setShowStoreSelection(true);
        setShowLogin(false);
      }
    } catch (error) {
      console.error('Error checking saved session:', error);
    }
  };

  const checkNetworkStatus = async () => {
    const state = await NetInfo.fetch();
    setIsOnline(state.isConnected);
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const selectStore = async (storeConfig) => {
    try {
      setLoading(true);
      
      // Save store to database
      await db.saveStore(storeConfig);
      
      // Set selected store
      setSelectedStore(storeConfig);
      setShowStoreSelection(false);
      setShowLogin(true);
      
      // Set API base URL
      api.defaults.baseURL = storeConfig.apiUrl;
      
      // Set default username
      setLoginForm({ username: storeConfig.defaultUsername || '', password: '' });
      
      showSnackbar(`Selected store: ${storeConfig.name}`);
    } catch (error) {
      console.error('Error selecting store:', error);
      showSnackbar('Error selecting store');
    } finally {
      setLoading(false);
    }
  };

  const createCustomStore = async () => {
    if (!customStoreForm.name.trim()) {
      showSnackbar('Please enter a store name');
      return;
    }

    const customStore = {
      id: `custom-${Date.now()}`,
      name: customStoreForm.name,
      location: customStoreForm.location,
      apiUrl: customStoreForm.apiUrl || CLOUD_API_URL,
      defaultUsername: ''
    };

    await selectStore(customStore);
    setShowCustomStoreDialog(false);
    setCustomStoreForm({ name: '', location: '', apiUrl: CLOUD_API_URL });
  };

  const login = async () => {
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      showSnackbar('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (isOnline) {
        try {
          response = await api.post('/auth/login', loginForm);
        } catch (error) {
          console.log('Cloud login failed, trying local...');
          response = await localApi.post('/auth/login', loginForm);
        }
      }

      if (response && response.data) {
        const { token, user } = response.data;
        
        // Save user with store info
        const userWithStore = { ...user, token, storeId: selectedStore.id };
        await db.saveUser(userWithStore);
        
        setCurrentUser(userWithStore);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setShowLogin(false);
        showSnackbar('✅ Login successful!');
        
        // Clear password from form for security
        setLoginForm({ ...loginForm, password: '' });
        
        loadProducts();
      }
    } catch (error) {
      console.error('Login error:', error);
      showSnackbar('❌ Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await db.clearUserData();
      setCurrentUser(null);
      setShowLogin(true);
      setShowStoreSelection(false);
      setCart([]);
      setProducts([]);
      api.defaults.headers.common['Authorization'] = '';
      setLoginForm({ username: selectedStore?.defaultUsername || '', password: '' });
      showSnackbar('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const switchStore = () => {
    setShowStoreSelection(true);
    setShowLogin(false);
  };

  const loadProducts = async () => {
    try {
      if (isOnline) {
        const response = await api.get('/products');
        setProducts(response.data);
        await db.saveProducts(response.data, selectedStore.id);
        setLastSync(new Date());
      } else {
        const offlineProducts = await db.getProducts(selectedStore.id);
        setProducts(offlineProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      const offlineProducts = await db.getProducts(selectedStore.id);
      setProducts(offlineProducts);
    }
  };

  const syncData = async () => {
    if (!isOnline || !selectedStore) return;

    try {
      const pendingSales = await db.getPendingSales(selectedStore.id);
      
      for (const sale of pendingSales) {
        try {
          await api.post('/sales', {
            items: sale.items,
            paymentMethod: sale.paymentMethod,
            total: sale.total,
            timestamp: sale.timestamp,
            cashier: sale.cashier
          });
          await db.markSaleSynced(sale.id);
        } catch (error) {
          console.error('Error syncing sale:', error);
        }
      }
      
      loadProducts();
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      showSnackbar('Cart is empty');
      return;
    }

    const sale = {
      id: uuidv4(),
      clientId: uuidv4(),
      items: cart,
      paymentMethod,
      total: getCartTotal(),
      timestamp: new Date().toISOString(),
      cashier: currentUser?.username || 'Unknown'
    };

    try {
      if (isOnline) {
        await api.post('/sales', sale);
        showSnackbar('✅ Sale completed and synced');
      } else {
        await db.saveSale(sale, selectedStore.id);
        showSnackbar('✅ Sale saved (will sync when online)');
      }
      
      setCart([]);
      setShowPaymentDialog(false);
      setPaymentMethod('cash');
    } catch (error) {
      console.error('Sale error:', error);
      await db.saveSale(sale, selectedStore.id);
      showSnackbar('✅ Sale saved locally');
      setCart([]);
      setShowPaymentDialog(false);
      setPaymentMethod('cash');
    }
  };

  // Store Selection Screen
  if (showStoreSelection) {
    return (
      <PaperProvider>
        <View style={styles.container}>
          <Appbar.Header>
            <Appbar.Content title="Select Store" />
          </Appbar.Header>
          
          <ScrollView style={styles.content}>
            <Title style={styles.sectionTitle}>Choose Your Store</Title>
            
            {STORE_CONFIGS.slice(0, -1).map(store => (
              <Card key={store.id} style={styles.storeCard} onPress={() => selectStore(store)}>
                <Card.Content>
                  <Title>{store.name}</Title>
                  <Text>{store.location}</Text>
                </Card.Content>
              </Card>
            ))}
            
            <Card style={styles.storeCard} onPress={() => setShowCustomStoreDialog(true)}>
              <Card.Content>
                <Title>+ Add Custom Store</Title>
                <Text>Configure your own store settings</Text>
              </Card.Content>
            </Card>
          </ScrollView>

          {/* Custom Store Dialog */}
          <Portal>
            <Dialog visible={showCustomStoreDialog} onDismiss={() => setShowCustomStoreDialog(false)}>
              <Dialog.Title>Add Custom Store</Dialog.Title>
              <Dialog.Content>
                <TextInput
                  label="Store Name"
                  value={customStoreForm.name}
                  onChangeText={(text) => setCustomStoreForm({...customStoreForm, name: text})}
                  style={styles.input}
                />
                <TextInput
                  label="Location"
                  value={customStoreForm.location}
                  onChangeText={(text) => setCustomStoreForm({...customStoreForm, location: text})}
                  style={styles.input}
                />
                <TextInput
                  label="API URL"
                  value={customStoreForm.apiUrl}
                  onChangeText={(text) => setCustomStoreForm({...customStoreForm, apiUrl: text})}
                  style={styles.input}
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setShowCustomStoreDialog(false)}>Cancel</Button>
                <Button onPress={createCustomStore}>Add Store</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </View>
      </PaperProvider>
    );
  }

  // Login Screen
  if (showLogin) {
    return (
      <PaperProvider>
        <View style={styles.container}>
          <View style={styles.loginContainer}>
            <Title style={styles.loginTitle}>Yanoi POS</Title>
            <Text style={styles.storeInfo}>
              {selectedStore?.name} - {selectedStore?.location}
            </Text>
            
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
            
            <Button 
              mode="contained" 
              onPress={login} 
              style={styles.button} 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            
            <Button 
              mode="text" 
              onPress={switchStore}
              style={styles.switchStoreButton}
            >
              Switch Store
            </Button>
          </View>
        </View>
      </PaperProvider>
    );
  }

  // Main POS Screen
  return (
    <PaperProvider>
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Yanoi POS" subtitle={selectedStore?.name} />
          <Menu
            visible={storeMenuVisible}
            onDismiss={() => setStoreMenuVisible(false)}
            anchor={
              <Appbar.Action 
                icon="store" 
                onPress={() => setStoreMenuVisible(true)} 
              />
            }
          >
            <Menu.Item onPress={switchStore} title="Switch Store" />
            <Divider />
            <Menu.Item onPress={logout} title="Logout" />
          </Menu>
        </Appbar.Header>

        <View style={styles.content}>
          <View style={styles.statusBar}>
            <Chip icon={isOnline ? "wifi" : "wifi-off"} mode="outlined">
              {isOnline ? 'Online' : 'Offline'}
            </Chip>
            {lastSync && (
              <Chip icon="sync" mode="outlined">
                {`Synced: ${lastSync.toLocaleTimeString()}`}
              </Chip>
            )}
            <Chip icon="account" mode="outlined">
              {currentUser?.username}
            </Chip>
          </View>

          {!isOnline && (
            <Text style={styles.offlineNotice}>
              Operating in offline mode. Sales will sync when connection is restored.
            </Text>
          )}

          <View style={[styles.mainContent, { flexDirection: isTablet ? 'row' : 'column' }]}>
            {/* Products Section */}
            <View style={[styles.productsSection, { flex: isTablet ? 2 : 1 }]}>
              <Title>Products</Title>
              <FlatList
                data={products}
                numColumns={isTablet ? 3 : 2}
                key={isTablet ? 'tablet' : 'phone'}
                renderItem={({ item }) => (
                  <Card style={[styles.productCard, { width: isTablet ? '31%' : '48%' }]} onPress={() => addToCart(item)}>
                    <Card.Content>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productPrice}>₹{item.price}</Text>
                      <Text style={styles.productCategory}>{item.category}</Text>
                    </Card.Content>
                  </Card>
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.productsList}
              />
            </View>

            {/* Cart Section */}
            <View style={[styles.cartSection, { flex: isTablet ? 1 : 1 }]}>
              <Title>Cart ({cart.length})</Title>
              
              <ScrollView style={styles.cartItems}>
                {cart.map(item => (
                  <Surface key={item.id} style={styles.cartItem}>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemPrice}>₹{item.price} each</Text>
                    </View>
                    <View style={styles.cartItemActions}>
                      <Button 
                        mode="outlined" 
                        compact 
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <Text style={styles.quantity}>{item.quantity}</Text>
                      <Button 
                        mode="outlined" 
                        compact 
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </View>
                  </Surface>
                ))}
              </ScrollView>

              <View style={styles.cartFooter}>
                <Text style={styles.total}>Total: ₹{getCartTotal()}</Text>
                
                <View style={styles.paymentMethods}>
                  <Button 
                    mode={paymentMethod === 'cash' ? 'contained' : 'outlined'}
                    onPress={() => setPaymentMethod('cash')}
                    style={styles.paymentButton}
                  >
                    Cash
                  </Button>
                  <Button 
                    mode={paymentMethod === 'card' ? 'contained' : 'outlined'}
                    onPress={() => setPaymentMethod('card')}
                    style={styles.paymentButton}
                  >
                    Card
                  </Button>
                  <Button 
                    mode={paymentMethod === 'upi' ? 'contained' : 'outlined'}
                    onPress={() => setPaymentMethod('upi')}
                    style={styles.paymentButton}
                  >
                    UPI
                  </Button>
                </View>

                <Button 
                  mode="contained" 
                  onPress={() => setShowPaymentDialog(true)}
                  style={styles.checkoutButton}
                  disabled={cart.length === 0}
                >
                  Complete Sale
                </Button>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Confirmation Dialog */}
        <Portal>
          <Dialog visible={showPaymentDialog} onDismiss={() => setShowPaymentDialog(false)}>
            <Dialog.Title>Confirm Sale</Dialog.Title>
            <Dialog.Content>
              <Text>Total: ₹{getCartTotal()}</Text>
              <Text>Payment Method: {paymentMethod.toUpperCase()}</Text>
              <Text>Items: {cart.length}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowPaymentDialog(false)}>Cancel</Button>
              <Button onPress={processSale}>Confirm</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Snackbar */}
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
  content: {
    flex: 1,
    padding: isTablet ? 16 : 8,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1976d2',
  },
  storeInfo: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchStoreButton: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  storeCard: {
    marginBottom: 16,
    elevation: 2,
  },
  mainContent: {
    flex: 1,
    gap: 16,
  },
  productsSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  cartSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  productsList: {
    gap: 8,
  },
  productCard: {
    margin: 4,
    elevation: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 16,
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
    fontSize: isTablet ? 24 : 20,
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
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
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



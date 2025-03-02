import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '@env'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../AuthContext';

const HomeScreen = () => {
  const { user } = React.useContext(AuthContext);
  const userId = user?.email || "USERA"; // Use logged in user or default to USERA
  
  // API endpoints
  const TRANSACTIONS_URL = 'http://10.10.1.136:3080/api/transactions';
  const USER_TRANSACTIONS_URL = `${TRANSACTIONS_URL}/userRange/${userId}`;
  const TRANSACTION_COUNT_URL = `${TRANSACTIONS_URL}/count/${userId}`;

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [transactionCount, setTransactionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch transaction count
  const fetchTransactionCount = async () => {
    try {
      console.log(`Fetching transaction count for user: ${userId}`);
      const response = await fetch(TRANSACTION_COUNT_URL);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Transaction count:', data);
        setTransactionCount(data.totalCount || 0);
        return data.totalCount || 0;
      } else {
        console.log('Failed to fetch transaction count');
        return 0;
      }
    } catch (error) {
      console.error('Error fetching transaction count:', error);
      return 0;
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      
      // First get the count
      const count = await fetchTransactionCount();
      
      // Then fetch transactions
      console.log(`Fetching transactions for user: ${userId}`);
      const limit = Math.min(count, 10); // Limit to 10 transactions
      const url = `${USER_TRANSACTIONS_URL}?startIndex=0&endIndex=${limit}`;
      
      console.log('Fetching from URL:', url);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Fetched ${data.length} transactions`);
        
        // Format the transactions for display
        const formattedTransactions = data.map(transaction => ({
          id: transaction.id || String(Math.random()),
          name: transaction.name || 'Unnamed Transaction',
          total: transaction.amount || transaction.total || 0,
          date: transaction.date ? new Date(transaction.date).toLocaleDateString() : 'Unknown date',
          status: 'api'
        }));
        
        // Load local transactions
        const localTransactions = await loadLocalTransactions();
        
        // Format local transactions
        const formattedLocalTransactions = localTransactions.map(t => ({
          id: t.id || String(Math.random()),
          name: t.name || 'Local Transaction',
          total: t.total || 0,
          date: t.date ? new Date(t.date).toLocaleDateString() : 'Unknown date',
          status: 'local'
        }));
        
        // Combine and sort by date (newest first)
        const allTransactions = [...formattedLocalTransactions, ...formattedTransactions]
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setRecentTransactions(allTransactions);
      } else {
        console.error('Failed to fetch transactions:', response.status);
        
        // If API fails, just use local transactions
        const localTransactions = await loadLocalTransactions();
        const formattedLocalTransactions = localTransactions.map(t => ({
          id: t.id || String(Math.random()),
          name: t.name || 'Local Transaction',
          total: t.total || 0,
          date: t.date ? new Date(t.date).toLocaleDateString() : 'Unknown date',
          status: 'local'
        }));
        
        setRecentTransactions(formattedLocalTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions. Please try again.');
      
      // If error, try to load local transactions
      const localTransactions = await loadLocalTransactions();
      if (localTransactions.length > 0) {
        const formattedLocalTransactions = localTransactions.map(t => ({
          id: t.id || String(Math.random()),
          name: t.name || 'Local Transaction',
          total: t.total || 0,
          date: t.date ? new Date(t.date).toLocaleDateString() : 'Unknown date',
          status: 'local'
        }));
        setRecentTransactions(formattedLocalTransactions);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load local transactions
  const loadLocalTransactions = async () => {
    try {
      const localTransactionsJson = await AsyncStorage.getItem('localTransactions');
      if (localTransactionsJson) {
        return JSON.parse(localTransactionsJson);
      }
      return [];
    } catch (error) {
      console.error('Error loading local transactions:', error);
      return [];
    }
  };

  // Debug local storage
  const debugLocalStorage = async () => {
    try {
      const localTransactionsJson = await AsyncStorage.getItem('localTransactions');
      console.log('Raw local transactions data:', localTransactionsJson);
      if (localTransactionsJson) {
        const parsed = JSON.parse(localTransactionsJson);
        console.log('Parsed local transactions:', parsed.length, 'items');
        parsed.forEach((t, i) => {
          console.log(`Transaction ${i+1}:`, t.name, t.total);
        });
      } else {
        console.log('No local transactions found in storage');
      }
    } catch (error) {
      console.error('Error debugging local storage:', error);
    }
  };

  // Use useFocusEffect to reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('HomeScreen focused - refreshing data');
      debugLocalStorage();
      fetchTransactions();
      return () => {
        // Cleanup if needed
      };
    }, [userId])
  );

  // Initial load
  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to FairShare!</Text>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.subtitle}>Recent Transactions</Text>
            <Text style={styles.transactionCount}>
              {transactionCount > 0 ? `${recentTransactions.length} of ${transactionCount}` : ''}
            </Text>
          </View>
          
          {recentTransactions.length > 0 ? (
            <FlatList
              data={recentTransactions}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.transactionItem}>
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionText}>{item.name}</Text>
                    <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    {item.status === 'local' && (
                      <View style={styles.localBadge}>
                        <Text style={styles.localBadgeText}>Local</Text>
                      </View>
                    )}
                    <Text style={styles.amount}>
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                </View>
              )}
              refreshing={refreshing}
              onRefresh={fetchTransactions}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <TouchableOpacity 
                style={[styles.button, styles.emptyStateButton]} 
                onPress={() => navigation.navigate('Camera')}
              >
                <Text style={styles.buttonText}>Create a Split</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity style={styles.floatingButton} onPress={fetchTransactions}>
            <MaterialIcons name="refresh" size={28} color="white" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 45,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subtitle: { 
    fontSize: 18, 
    fontWeight: 'bold',
  },
  transactionCount: {
    fontSize: 14,
    color: '#6c757d',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  transactionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // For Android shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  localBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  localBadgeText: {
    color: '#212529',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
  },
  emptyStateButton: {
    width: 200,
  }
});

export default HomeScreen;

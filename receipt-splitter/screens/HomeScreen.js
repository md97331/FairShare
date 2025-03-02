import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { API_BASE_URL } from '@env';
import { AuthContext } from '../AuthContext';
import { useNavigation } from '@react-navigation/native';

const transactionsURL = new URL('api/transactions', API_BASE_URL).toString();
const authURL = new URL('api/auth/userinfo', API_BASE_URL).toString();

const HomeScreen = () => {
  const navigation = useNavigation();
  // AuthContext now contains only the user's email.
  const { user } = useContext(AuthContext);
  // Use the email as the unique identifier; fallback if not set.
  const currentUserId = user?.email || "test@example.com";

  // Local state for user info, weekly summary, transactions, etc.
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [transactionCount, setTransactionCount] = useState(0);
  const [weeklySummary, setWeeklySummary] = useState({
    spentLastWeek: 0,
    amountOwed: 0,
  });

  // 1. Fetch user info from /api/auth/userinfo/:userId
  const fetchUserInfo = async () => {
    try {
      const url = `${authURL}/${encodeURIComponent(currentUserId)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      } else {
        console.error('Error fetching user info, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // 2. Fetch recent transactions from /api/transactions/userRange/:userId?startIndex=0&endIndex=5
  const fetchRecentTransactions = async () => {
    try {
      const url = `${transactionsURL}/userRange/${encodeURIComponent(currentUserId)}?startIndex=0&endIndex=5`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setRecentTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // 3.r Fetch transaction count from /api/transactions/count/:userId
  const fetchTransactionCount = async () => {
    try {
      const url = `${transactionsURL}/count/${encodeURIComponent(currentUserId)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch transaction count');
      const data = await response.json();
      setTransactionCount(data.totalCount || 0);
    } catch (error) {
      console.error('Error fetching transaction count:', error);
    }
  };

  // 4. Fetch weekly summary (placeholder using monthly endpoint)
  const fetchWeeklySummary = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // 1-indexed month
      const url = `${transactionsURL}/monthly/${encodeURIComponent(currentUserId)}?year=${year}&month=${month}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch monthly transactions');
      const data = await response.json();
      // Calculate "spent last week" as sum of transaction totals (placeholder logic)
      let spentLastWeek = data.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
      // Placeholder: Assume amount owed is half of spentLastWeek
      let amountOwed = spentLastWeek * 0.5;
      setWeeklySummary({ spentLastWeek, amountOwed });
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    }
  };

  // Combine all data loads
  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserInfo(),
      fetchRecentTransactions(),
      fetchTransactionCount(),
      fetchWeeklySummary(),
    ]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Render each transaction card.
  const renderTransaction = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionItem} 
      onPress={() => navigation.navigate('TransactionDetail', { transaction: item })}
    >
      <Text style={styles.transactionText}>{item.name}</Text>
      <Text style={styles.amount}>${Number(item.total).toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.wave} />
        <Text style={styles.headerTitle}>
          Welcome, {userInfo.name || currentUserId}!
        </Text>
        <Text style={styles.headerSubtitle}>
          Here’s a snapshot of your recent transactions.
        </Text>
      </View>
  
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Spent Last Week:</Text>
          <Text style={styles.summaryValue}>
            ${weeklySummary.spentLastWeek.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>You Owe:</Text>
          <Text style={styles.summaryValue}>
            ${weeklySummary.amountOwed.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Transactions:</Text>
          <Text style={styles.summaryValue}>{transactionCount}</Text>
        </View>
      </View>
  
      {/* Recent Transactions Section */}
      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={recentTransactions}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderTransaction}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No recent transactions found.</Text>
          }
        />
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 80, // Extra top padding for iPhone Pro Max notch/dynamic island
    paddingHorizontal: 20,
  },
  headerContainer: {
    backgroundColor: '#e0f0ff', // Light blue header background
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 4,
  },
  wave: {
    backgroundColor: '#007bff', // Main blue accent for wave
    height: 80,
    width: width * 1.2,
    position: 'absolute',
    top: -40,
    left: -20,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    transform: [{ rotate: '10deg' }],
    opacity: 0.4,
  },
  headerTitle: {
    marginTop: 80,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 20,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#555',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  list: {
    marginBottom: 20,
  },
  transactionItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  transactionText: {
    fontSize: 14,
    color: '#333',
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'green',
  },
  emptyText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default HomeScreen;
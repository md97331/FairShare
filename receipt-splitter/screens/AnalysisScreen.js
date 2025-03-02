import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { API_BASE_URL } from '@env';
import { AuthContext } from '../AuthContext';

const AnalysisScreen = () => {
  const { user } = useContext(AuthContext);
  // Use the user's email; fallback if not set
  const currentUserId = user?.email || 'test@example.com';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch transactions for analysis
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Example: userRange endpoint
      const url = new URL(
        `api/transactions/userRange/${encodeURIComponent(currentUserId)}?startIndex=0&endIndex=10`,
        API_BASE_URL
      ).toString();
      console.log('Fetching transactions from:', url);

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentUserId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  // Prepare chart data from transactions
  const prepareChartData = () => {
    if (transactions.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }
    // Sort by date ascending
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    // Format labels as "MM-DD" or your preferred format
    const labels = sorted.map((t) => t.date.slice(5, 10));
    const amounts = sorted.map((t) => Number(t.total) || 0);

    return {
      labels,
      datasets: [
        {
          data: amounts,
          color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  };

  const chartData = prepareChartData();
  const screenWidth = Dimensions.get('window').width;

  // Helper to format currency
  const formatCurrency = (amount) => `$${Number(amount).toFixed(2)}`;

  // Render each transaction card
  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionCard}>
      <Text style={styles.transactionName}>{item.name}</Text>
      <Text style={styles.transactionAmount}>{formatCurrency(item.total)}</Text>
    </View>
  );

  // Header containing the chart
  const renderHeader = () => {
    if (loading && transactions.length === 0) {
      // If still loading & no data, show spinner
      return (
        <View style={styles.chartContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      );
    }

    // If no transactions, show "No data" message
    if (transactions.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.emptyChartText}>No data for chart.</Text>
        </View>
      );
    }

    // Otherwise, show the chart
    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={screenWidth - 20} 
          height={250}
          xLabelsOffset={-10}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#f0f8ff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: { borderRadius: 16 },
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#007bff' },
          }}
          bezier
          verticalLabelRotation={45}
          style={{
            marginVertical: 10,
            borderRadius: 26,
            marginRight: 50,
          }}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Text style={styles.headerTitle}>Spending Analysis</Text>
      
      {/* A single FlatList that includes a ListHeaderComponent for the chart */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          // If the data is done loading but empty, show message
          !loading && transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions found.</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
   
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 20,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 20,
  },
  emptyChartText: {
    textAlign: 'center',
    color: '#777',
    fontSize: 14,
    marginVertical: 20,
  },
  transactionCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  transactionName: {
    fontSize: 16,
    color: '#333',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'green',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    fontSize: 14,
    marginVertical: 20,
  },
});

export default AnalysisScreen;
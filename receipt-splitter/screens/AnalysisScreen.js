import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import { API_BASE_URL } from '@env';
import { AuthContext } from '../AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const AnalysisScreen = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.email || "USERA"; // Use logged in user or default to USERA
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [pieChartData, setPieChartData] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [averageTransaction, setAverageTransaction] = useState(0);
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'list'
  const [chartType, setChartType] = useState('line'); // 'line' or 'pie'
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  
  // Colors for pie chart
  const chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
    '#FF9F40', '#8AC24A', '#607D8B', '#E91E63', '#3F51B5'
  ];

  const fetchTransactions = async (selectedMonth, selectedYear) => {
    setLoading(true);
    try {
      const numMonth = Number(selectedMonth);
      const numYear = Number(selectedYear);
      
      // Try to fetch from API first
      let apiTransactions = [];
      try {
        const url = `http://10.10.1.136:3080/api/transactions/monthly/${userId}?year=${numYear}&month=${numMonth}`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        
        if (response.ok) {
          apiTransactions = await response.json();
          console.log(`Fetched ${apiTransactions.length} transactions from API`);
        } else {
          console.log('API request failed, status:', response.status);
        }
      } catch (error) {
        console.log('API fetch error:', error);
      }
      
      // Load local transactions as backup
      let localTransactions = [];
      try {
        const localTransactionsJson = await AsyncStorage.getItem('localTransactions');
        if (localTransactionsJson) {
          const allLocalTransactions = JSON.parse(localTransactionsJson);
          
          // Filter by month and year
          localTransactions = allLocalTransactions.filter(t => {
            if (!t.date) return false;
            const date = new Date(t.date);
            return date.getMonth() + 1 === numMonth && date.getFullYear() === numYear;
          });
          
          console.log(`Found ${localTransactions.length} local transactions for ${months[numMonth-1]} ${numYear}`);
        }
      } catch (error) {
        console.log('Error loading local transactions:', error);
      }
      
      // Combine and normalize data
      const combinedTransactions = [...apiTransactions, ...localTransactions].map(t => {
        // Safely create date object
        let transactionDate;
        try {
          transactionDate = t.date ? new Date(t.date) : new Date();
          // Validate the date
          if (isNaN(transactionDate.getTime())) {
            console.log("Invalid date detected, using current date instead");
            transactionDate = new Date();
          }
        } catch (error) {
          console.log("Error parsing date:", error);
          transactionDate = new Date();
        }
        
        return {
          id: t.id || String(Math.random()),
          name: t.name || 'Unnamed Transaction',
          amount: t.amount || t.total || 0,
          date: transactionDate,
          merchant: t.merchant || '',
          category: getCategoryFromTransaction(t),
          source: t.status || 'api'
        };
      });
      
      // Sort by date
      combinedTransactions.sort((a, b) => a.date - b.date);
      
      if (combinedTransactions.length === 0) {
        console.log("No data available for selected period.");
        setTransactions([]);
        setChartData({ labels: [], datasets: [{ data: [] }] });
        setPieChartData([]);
        setTotalSpent(0);
        setAverageTransaction(0);
        setLoading(false);
        return;
      }
      
      // Process transactions for charts and stats
      processTransactionsData(combinedTransactions);
      
    } catch (error) {
      console.error('Error processing transactions:', error);
      Alert.alert("Error", "Failed to process transaction data. Please try again later.");
      setTransactions([]);
      setChartData({ labels: [], datasets: [{ data: [] }] });
      setPieChartData([]);
      setTotalSpent(0);
      setAverageTransaction(0);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to determine category from transaction
  const getCategoryFromTransaction = (transaction) => {
    // This is a simple implementation - you could enhance this with more sophisticated logic
    const name = (transaction.name || '').toLowerCase();
    const merchant = (transaction.merchant || '').toLowerCase();
    
    if (name.includes('dinner') || name.includes('lunch') || 
        merchant.includes('restaurant') || merchant.includes('cafe')) {
      return 'Food';
    } else if (name.includes('grocery') || merchant.includes('market') || 
              merchant.includes('store')) {
      return 'Groceries';
    } else if (name.includes('movie') || name.includes('entertainment')) {
      return 'Entertainment';
    } else if (name.includes('transport') || name.includes('uber') || 
              name.includes('lyft') || name.includes('taxi')) {
      return 'Transportation';
    } else if (name.includes('bill') || name.includes('utility')) {
      return 'Bills';
    }
    
    return 'Other';
  };
  
  // Process transactions for charts and statistics
  const processTransactionsData = (transactions) => {
    // Set the transactions list
    setTransactions(transactions);
    
    // Calculate total spent
    const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    setTotalSpent(total);
    
    // Calculate average transaction
    setAverageTransaction(total / transactions.length);
    
    // Prepare line chart data - group by date
    const dateGroups = {};
    transactions.forEach(t => {
      const dateStr = t.date.toLocaleDateString();
      if (!dateGroups[dateStr]) {
        dateGroups[dateStr] = 0;
      }
      dateGroups[dateStr] += Number(t.amount);
    });
    
    // Convert to chart format
    const dates = Object.keys(dateGroups);
    const amounts = dates.map(date => dateGroups[date]);
    
    // Format dates for display (e.g., "Jan 15")
    const formattedDates = dates.map(date => {
      try {
        const d = new Date(date);
        // Check if date is valid before accessing month
        if (isNaN(d.getTime())) {
          return "Invalid";
        }
        // Make sure month is in range before accessing months array
        const monthIndex = d.getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${months[monthIndex].substring(0, 3)} ${d.getDate()}`;
        }
        return "Unknown";
      } catch (error) {
        console.log("Date formatting error:", error, "for date:", date);
        return "Error";
      }
    });
    
    setChartData({
      labels: formattedDates,
      datasets: [{
        data: amounts,
        color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
        strokeWidth: 2,
      }],
    });
    
    // Prepare pie chart data - group by category
    const categoryGroups = {};
    transactions.forEach(t => {
      if (!categoryGroups[t.category]) {
        categoryGroups[t.category] = 0;
      }
      categoryGroups[t.category] += Number(t.amount);
    });
    
    // Convert to pie chart format
    const pieData = Object.keys(categoryGroups).map((category, index) => ({
      name: category,
      amount: categoryGroups[category],
      color: chartColors[index % chartColors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    }));
    
    setPieChartData(pieData);
  };
  
  useEffect(() => {
    fetchTransactions(month, year);
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Spending Analysis</Text>
        
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={month}
            onValueChange={(itemValue) => {
              setMonth(itemValue);
              fetchTransactions(itemValue, year);
            }}
            style={styles.picker}
            mode="dropdown"
          >
            {months.map((monthName, i) => (
              <Picker.Item key={i + 1} label={`${monthName}`} value={String(i + 1)} />
            ))}
          </Picker>
          <Picker
            selectedValue={year}
            onValueChange={(itemValue) => {
              setYear(itemValue);
              fetchTransactions(month, itemValue);
            }}
            style={styles.picker}
            mode="dropdown"
          >
            {years.map((y) => (
              <Picker.Item key={y} label={`${y}`} value={String(y)} />
            ))}
          </Picker>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Spent</Text>
                <Text style={styles.statValue}>{formatCurrency(totalSpent)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Average Transaction</Text>
                <Text style={styles.statValue}>{formatCurrency(averageTransaction)}</Text>
              </View>
            </View>
            
            <View style={styles.chartTypeSelector}>
              <TouchableOpacity 
                style={[styles.chartTypeButton, chartType === 'line' && styles.activeChartType]}
                onPress={() => setChartType('line')}
              >
                <Text style={styles.chartTypeText}>Timeline</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.chartTypeButton, chartType === 'pie' && styles.activeChartType]}
                onPress={() => setChartType('pie')}
              >
                <Text style={styles.chartTypeText}>Categories</Text>
              </TouchableOpacity>
            </View>
            
            {chartData.datasets[0].data.length > 0 ? (
              <View style={styles.chartContainer}>
                {chartType === 'line' ? (
                  <LineChart
                    data={chartData}
                    width={Dimensions.get('window').width - 40}
                    height={220}
                    chartConfig={{
                      backgroundColor: '#ffffff',
                      backgroundGradientFrom: '#ffffff',
                      backgroundGradientTo: '#ffffff',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      style: { borderRadius: 16 },
                      propsForDots: { r: '4', strokeWidth: '2', stroke: '#007bff' },
                      propsForLabels: { fontSize: 10 },
                    }}
                    bezier
                    style={styles.chart}
                  />
                ) : (
                  pieChartData.length > 0 ? (
                    <PieChart
                      data={pieChartData}
                      width={Dimensions.get('window').width - 40}
                      height={220}
                      chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      }}
                      accessor="amount"
                      backgroundColor="transparent"
                      paddingLeft="15"
                      absolute
                    />
                  ) : (
                    <Text style={styles.noDataText}>No category data available.</Text>
                  )
                )}
              </View>
            ) : (
              <Text style={styles.noDataText}>No transactions available for this period.</Text>
            )}

            <View style={styles.viewSelector}>
              <TouchableOpacity 
                style={[styles.viewButton, viewMode === 'chart' && styles.activeView]}
                onPress={() => setViewMode('chart')}
              >
                <MaterialIcons name="insert-chart" size={20} color={viewMode === 'chart' ? '#007bff' : '#6c757d'} />
                <Text style={[styles.viewButtonText, viewMode === 'chart' && styles.activeViewText]}>Charts</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.viewButton, viewMode === 'list' && styles.activeView]}
                onPress={() => setViewMode('list')}
              >
                <MaterialIcons name="list" size={20} color={viewMode === 'list' ? '#007bff' : '#6c757d'} />
                <Text style={[styles.viewButtonText, viewMode === 'list' && styles.activeViewText]}>Transactions</Text>
              </TouchableOpacity>
            </View>
            
            {viewMode === 'list' && (
              <>
                <Text style={styles.subtitle}>Transaction History</Text>
                {transactions.length > 0 ? (
                  <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <View style={styles.transactionItem}>
                        <View style={styles.transactionHeader}>
                          <Text style={styles.transactionText}>{item.name}</Text>
                          <Text style={styles.transactionDate}>
                            {item.date.toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.transactionDetails}>
                          <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{item.category}</Text>
                          </View>
                          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                        </View>
                      </View>
                    )}
                    scrollEnabled={false}
                    nestedScrollEnabled={true}
                  />
                ) : (
                  <Text style={styles.noDataText}>No transactions found.</Text>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    color: '#2c3e50',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  loader: {
    marginTop: 50,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  chartTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#f8f9fa',
  },
  activeChartType: {
    backgroundColor: '#e9ecef',
  },
  chartTypeText: {
    color: '#495057',
    fontWeight: '500',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  viewSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    padding: 5,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeView: {
    backgroundColor: '#e9ecef',
  },
  viewButtonText: {
    marginLeft: 5,
    color: '#6c757d',
  },
  activeViewText: {
    color: '#007bff',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 10,
    color: '#2c3e50',
  },
  transactionItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  transactionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#495057',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6c757d',
    marginTop: 20,
    marginBottom: 20,
  },
});

export default AnalysisScreen;

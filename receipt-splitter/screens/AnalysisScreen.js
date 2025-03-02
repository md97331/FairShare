import React from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

// Sample Transaction Data
const transactions = [
  { id: '1', name: 'Groceries', amount: 50, date: '2024-02-20' },
  { id: '2', name: 'Electricity Bill', amount: 80, date: '2024-02-22' },
  { id: '3', name: 'Dinner Out', amount: 40, date: '2024-02-25' },
  { id: '4', name: 'Movie', amount: 20, date: '2024-02-27' },
  { id: '5', name: 'Shopping', amount: 100, date: '2024-02-28' },
];

// Convert transactions to chart data
const chartData = {
  labels: transactions.map((t) => t.date.slice(5)), // Show MM-DD format
  datasets: [
    {
      data: transactions.map((t) => t.amount),
      color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`, // Line color
      strokeWidth: 2, // Line thickness
    },
  ],
};

const AnalysisScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spending Analysis</Text>

      {/* Line Chart for Transactions */}
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 30} // Adjust to screen width
        height={250}
        chartConfig={{
          backgroundColor: '#f5f5f5',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: { borderRadius: 10 },
          propsForDots: { r: '4', strokeWidth: '2', stroke: '#007bff' },
        }}
        bezier
        style={{ marginVertical: 10, borderRadius: 10 }}
      />

      {/* Transaction List */}
      <Text style={styles.subtitle}>Transaction History</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.transactionItem}>
            <Text style={styles.transactionText}>{item.name}</Text>
            <Text style={styles.amount}>${item.amount}</Text>
          </View>
        )}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  transactionItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  transactionText: { fontSize: 16 },
  amount: { fontSize: 16, fontWeight: 'bold', color: 'green' },
});

export default AnalysisScreen;
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { API_BASE_URL } from '@env';
import { AuthContext } from '../AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const TRANSACTIONS_URL = new URL('api/transactions', API_BASE_URL).toString();

const TransactionScreen = ({ route, navigation }) => {
  // Defensive defaults for route params.
  const { title = "New Split", friends = [], receiptData = {}, imageUri = null } = route.params || {};
  const { user } = useContext(AuthContext);
  // Use the user's email as the unique identifier; if no name, use the email as name.
  const currentUserId = user ? user.email : "CurrentUser";
  const currentUserName = user?.name ? user.name : currentUserId;

  // Build safe receipt data.
  const safeReceiptData = {
    merchant: receiptData?.merchant || "Unknown Merchant",
    date: receiptData?.date || new Date().toLocaleDateString(),
    items: receiptData?.items || [],
    tax: receiptData?.tax || 0,
    total: receiptData?.total || 0,
  };

  // Ensure current user is included correctly in participants.
  const [participants, setParticipants] = useState([
    { id: currentUserId, name: currentUserName, isCurrentUser: true },
    // For other friends, assume each friend object has { email, name }.
    ...(Array.isArray(friends)
      ? friends.map(friend => ({
          id: friend.email || friend.id,  // Use email if available.
          name: friend.name || friend.email || "Unknown",
          isCurrentUser: false,
        }))
      : [])
  ]);

  // Initialize items (if none, add default).
  const [items, setItems] = useState(
    (Array.isArray(safeReceiptData.items) ? safeReceiptData.items : []).map(item => ({
      name: item?.name || "Unknown Item",
      price: item?.price || 0,
      assignedTo: [], // Participant IDs.
    }))
  );
  
  useEffect(() => {
    if (items.length === 0) {
      setItems([{
        name: "Total Amount",
        price: safeReceiptData.total || 0,
        assignedTo: []
      }]);
    }
  }, []);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState({
    taxPerPerson: 0,
    owedByPerson: {},
    total: 0,
    numParticipants: 1,
  });

  // Calculate summary (tax, owed amounts, etc.)
  useEffect(() => {
    calculateSummary();
  }, [items]);

  const calculateSummary = () => {
    try {
      const activeParticipantIds = new Set();
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (Array.isArray(item.assignedTo)) {
            item.assignedTo.forEach(id => {
              if (id) activeParticipantIds.add(id);
            });
          }
        });
      }
      // Always include the current user.
      activeParticipantIds.add(currentUserId);
      const numParticipants = activeParticipantIds.size;
      const taxPerPerson = (safeReceiptData.tax || 0) / numParticipants;
      const owedByPerson = {};
      // Initialize owed amounts with tax share.
      participants.forEach(person => {
        owedByPerson[person.id] = activeParticipantIds.has(person.id) ? taxPerPerson : 0;
      });
      // Add each item's cost.
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (item && Array.isArray(item.assignedTo) && item.assignedTo.length > 0) {
            const pricePerPerson = item.price / item.assignedTo.length;
            item.assignedTo.forEach(personId => {
              if (owedByPerson[personId] !== undefined) {
                owedByPerson[personId] += pricePerPerson;
              }
            });
          }
        });
      }
      const total = Object.values(owedByPerson).reduce((sum, amount) => sum + amount, 0);
      setSummary({
        taxPerPerson,
        owedByPerson,
        total,
        numParticipants,
      });
    } catch (error) {
      console.error("Error calculating summary:", error);
      setSummary({
        taxPerPerson: 0,
        owedByPerson: { [currentUserId]: safeReceiptData.total || 0 },
        total: safeReceiptData.total || 0,
        numParticipants: 1,
      });
    }
  };

  const openAssignModal = (index) => {
    setSelectedItemIndex(index);
    setModalVisible(true);
  };

  const toggleParticipantForItem = (participantId) => {
    const updatedItems = [...items];
    const item = updatedItems[selectedItemIndex];
    if (item.assignedTo.includes(participantId)) {
      item.assignedTo = item.assignedTo.filter(id => id !== participantId);
    } else {
      item.assignedTo.push(participantId);
    }
    setItems(updatedItems);
  };

  const isParticipantSelected = (participantId) => {
    if (selectedItemIndex === null) return false;
    return items[selectedItemIndex].assignedTo.includes(participantId);
  };

  const getParticipantNames = (assignedTo) => {
    if (assignedTo.length === 0) return "Unassigned";
    return assignedTo.map(id => {
      const participant = participants.find(p => p.id === id);
      return participant ? participant.name : "Unknown";
    }).join(", ");
  };

  const saveTransaction = async () => {
    const unassignedItems = items.filter(item => item.assignedTo.length === 0);
    if (unassignedItems.length > 0) {
      Alert.alert(
        "Unassigned Items",
        "Some items haven't been assigned to anyone. Continue anyway?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: submitTransaction }
        ]
      );
    } else {
      submitTransaction();
    }
  };

  const submitTransaction = async () => {
    try {
      setIsSubmitting(true);
      const transactionData = {
        name: title,
        date: new Date().toISOString(),
        users: participants.map(participant => {
          const participantItems = items
            .filter(item => item.assignedTo.includes(participant.id))
            .map(item => {
              const splitCount = item.assignedTo.length;
              const pricePerPerson = splitCount > 0 ? item.price / splitCount : item.price;
              return {
                name: item.name,
                price: pricePerPerson,
              };
            });
          const itemsTotal = participantItems.reduce((sum, item) => sum + item.price, 0);
          const taxShare = summary.owedByPerson[participant.id] - itemsTotal || 0;
          return {
            userId: participant.id,
            name: participant.name,
            items: participantItems,
            total: itemsTotal,
            ...(taxShare > 0 && { fees: taxShare }),
            splitAmount: summary.owedByPerson[participant.id] || 0,
          };
        }),
        userIds: participants
          .filter(p => summary.owedByPerson[p.id] > 0)
          .map(p => p.id),
        merchant: safeReceiptData.merchant,
        fees: safeReceiptData.tax || 0,
        subtotal: safeReceiptData.total - safeReceiptData.tax,
        total: safeReceiptData.total,
      };
      
      console.log('Sending transaction data:', JSON.stringify(transactionData, null, 2));
      
      const response = await fetch(TRANSACTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      
      if (response.ok) {
        Alert.alert(
          "Success",
          "Transaction saved successfully!",
          [{ text: "OK", onPress: () => navigation.navigate('MainApp', { screen: 'Home' }) }]
        );
      } else {
        let errorMessage = "Failed to save transaction";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        console.error('Transaction save error:', errorMessage);
        Alert.alert("Error", errorMessage);
      }
    } catch (error) {
      console.error("Error saving transaction:", error);
      Alert.alert("Error", "Failed to save transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendPaymentRequest = (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    const amount = summary.owedByPerson[participantId];
    if (!participant || !amount) return;
    Alert.alert(
      "Payment Request",
      `Send payment request of $${amount.toFixed(2)} to ${participant.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Send", 
          onPress: () => {
            // Implement payment request logic here.
            Alert.alert("Success", `Payment request sent to ${participant.name}`);
          }
        }
      ]
    );
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#007bff" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.merchantContainer}>
          <Text style={styles.merchantName}>{safeReceiptData.merchant}</Text>
          <Text style={styles.date}>{safeReceiptData.date}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemAssignees}>
                  {getParticipantNames(item.assignedTo)}
                </Text>
              </View>
              <View style={styles.itemActions}>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                <TouchableOpacity 
                  style={styles.assignButton}
                  onPress={() => openAssignModal(index)}
                >
                  <Icon name="person-add" size={20} color="#007bff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(safeReceiptData.subtotal || (safeReceiptData.total - (safeReceiptData.tax || 0)))}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(safeReceiptData.tax)}
              {summary.numParticipants > 0 && (
                <Text style={styles.taxSplit}>
                  {` (${formatCurrency(summary.taxPerPerson)} per person)`}
                </Text>
              )}
            </Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(safeReceiptData.total)}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Each Person Owes</Text>
          
          {participants.map((person) => (
            <View key={person.id} style={styles.personRow}>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>
                  {person.name} {person.isCurrentUser ? "(You)" : ""}
                </Text>
                <Text style={styles.personAmount}>
                  {formatCurrency(summary.owedByPerson[person.id] || 0)}
                </Text>
              </View>
              
              {!person.isCurrentUser && (
                <TouchableOpacity 
                  style={styles.requestButton}
                  onPress={() => sendPaymentRequest(person.id)}
                >
                  <Text style={styles.requestButtonText}>Request</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        
        <TouchableOpacity 
          style={[styles.saveButton, isSubmitting && styles.disabledButton]}
          onPress={saveTransaction}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Transaction</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Modal for assigning people to items */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Assign to: {selectedItemIndex !== null ? items[selectedItemIndex].name : ''}
            </Text>
            
            {participants.map((person) => (
              <TouchableOpacity
                key={person.id}
                style={[
                  styles.participantItem,
                  isParticipantSelected(person.id) && styles.selectedParticipant
                ]}
                onPress={() => toggleParticipantForItem(person.id)}
              >
                <Text style={[
                  styles.participantName,
                  isParticipantSelected(person.id) && styles.selectedParticipantText
                ]}>
                  {person.name} {person.isCurrentUser ? "(You)" : ""}
                </Text>
                {isParticipantSelected(person.id) && (
                  <Icon name="check" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  placeholder: {
    width: 40,
  },
  merchantContainer: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  date: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    color: '#2c3e50',
  },
  itemAssignees: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '500',
    marginRight: 10,
  },
  assignButton: {
    padding: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6c757d',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  taxSplit: {
    fontSize: 13,
    color: '#6c757d',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  personRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  personInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: 10,
  },
  personName: {
    fontSize: 15,
    color: '#2c3e50',
  },
  personAmount: {
    fontSize: 15,
    fontWeight: '500',
  },
  requestButton: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  requestButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
    textAlign: 'center',
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  selectedParticipant: {
    backgroundColor: '#007bff',
  },
  participantName: {
    fontSize: 16,
    color: '#2c3e50',
  },
  selectedParticipantText: {
    color: 'white',
    fontWeight: '500',
  },
  closeModalButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TransactionScreen;
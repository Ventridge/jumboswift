class TransactionController {
    async getTransactionStats(businessId, query) {
      const { startDate, endDate, groupBy = 'day' } = query;
      
      const pipeline = [
        {
          $match: {
            businessId: new ObjectId(businessId),
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate || new Date())
            }
          }
        },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  {
                    case: { $eq: [groupBy, 'day'] },
                    then: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                  },
                  {
                    case: { $eq: [groupBy, 'week'] },
                    then: { $week: '$createdAt' }
                  },
                  {
                    case: { $eq: [groupBy, 'month'] },
                    then: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
                  }
                ]
              }
            },
            totalAmount: { $sum: '$amount' },
            successCount: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            failureCount: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id': 1 } }
      ];
  
      return await Transaction.aggregate(pipeline);
    }
  
    async exportTransactions(businessId, options) {
      const { format, startDate, endDate, filters } = options;
      
      // Get transactions
      const transactions = await Transaction.find({
        businessId,
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate || new Date())
        },
        ...filters
      });
  
      // Generate export file
      const exportFile = format === 'csv' 
        ? await this.generateCSV(transactions)
        : await this.generateXLSX(transactions);
  
      // Upload to storage and get URL
      const url = await this.uploadExport(exportFile);
  
      return url;
    }
  }

    module.exports = TransactionController;
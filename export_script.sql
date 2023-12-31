-- Script to export data from HistoricalData table to CSV
.open "C:\Users\lauju\OneDrive - Singapore Polytechnic\intern\motor_data\HistoricalGroup2.dxpdb".mode csv.headers on.output "C:\Users\lauju\OneDrive - Singapore Polytechnic\intern\motor_data\Historical_data.csv"
SELECT *
FROM HistoricalData;
.output stdout
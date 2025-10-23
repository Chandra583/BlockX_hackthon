import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MileageHistoryTable from '../../components/MileageHistoryTable';
import VehicleService from '../../services/vehicle';

// Demo data based on your API response
const demoData = {
  "status": "success",
  "message": "Mileage history retrieved successfully",
  "data": {
    "vehicleId": "68f8cb850e0c57d22629f656",
    "vin": "1HGCM82633A12DSKL",
    "currentMileage": 270,
    "totalMileage": 270,
    "registeredMileage": 20,
    "serviceVerifiedMileage": 20,
    "lastOBDUpdate": {
      "mileage": 270,
      "deviceId": "OBD30011",
      "recordedAt": "2025-10-23T07:29:02.390Z"
    },
    "history": [
      {
        "_id": "68f9d93e93ee9f5712a8aece",
        "vehicleId": "68f8cb850e0c57d22629f656",
        "vin": "1HGCM82633A12DSKL",
        "mileage": 270,
        "recordedBy": {
          "_id": "68f8c8403867a54ec472ea29",
          "firstName": "manoj",
          "lastName": "NR",
          "role": "owner",
          "fullName": "manoj NR",
          "isLocked": false,
          "id": "68f8c8403867a54ec472ea29"
        },
        "recordedAt": "2025-10-23T07:29:02.390Z",
        "source": "automated",
        "notes": "OBD device OBD30011 reading",
        "verified": false,
        "deviceId": "OBD30011",
        "createdAt": "2025-10-23T07:29:02.391Z",
        "updatedAt": "2025-10-23T07:29:05.027Z",
        "__v": 0,
        "blockchainHash": "3iHLVZnuCeYARNtqhYcGizavH9L4MVK2pgMkgDekYzsnYcimAxb9LTwLqVQC5VmHV8pe4yXoKfsN7Egtu2YL924a"
      },
      {
        "_id": "68f9d93b93ee9f5712a8adca",
        "vehicleId": "68f8cb850e0c57d22629f656",
        "vin": "1HGCM82633A12DSKL",
        "mileage": 260,
        "recordedBy": {
          "_id": "68f8c8403867a54ec472ea29",
          "firstName": "manoj",
          "lastName": "NR",
          "role": "owner",
          "fullName": "manoj NR",
          "isLocked": false,
          "id": "68f8c8403867a54ec472ea29"
        },
        "recordedAt": "2025-10-23T07:28:59.141Z",
        "source": "automated",
        "notes": "OBD device OBD30011 reading",
        "verified": false,
        "deviceId": "OBD30011",
        "createdAt": "2025-10-23T07:28:59.142Z",
        "updatedAt": "2025-10-23T07:29:01.222Z",
        "__v": 0,
        "blockchainHash": "4SwtkzRHWyyUiAJhJMMvojvK6yB5WTJBS4rWwhng1ufRvQmPK5iJCc6Phk2rMWFz3pbAKFT8me9Q2B7GahYJ44Py"
      },
      {
        "_id": "68f9d93693ee9f5712a8acc7",
        "vehicleId": "68f8cb850e0c57d22629f656",
        "vin": "1HGCM82633A12DSKL",
        "mileage": 250,
        "recordedBy": {
          "_id": "68f8c8403867a54ec472ea29",
          "firstName": "manoj",
          "lastName": "NR",
          "role": "owner",
          "fullName": "manoj NR",
          "isLocked": false,
          "id": "68f8c8403867a54ec472ea29"
        },
        "recordedAt": "2025-10-23T07:28:50.612Z",
        "source": "automated",
        "notes": "OBD device OBD30011 reading",
        "verified": false,
        "deviceId": "OBD30011",
        "createdAt": "2025-10-23T07:28:50.612Z",
        "updatedAt": "2025-10-23T07:28:53.636Z",
        "__v": 0,
        "blockchainHash": "26QHxJ8X44QyCU3D1eDBYgZABEmJMHPmLAZKvpKWdLxEm7FHP1pc2Rfj6wtbhWznST6AKrQEcs9sxM4deqagdBo3"
      },
      {
        "_id": "68f9d92b93ee9f5712a8aad0",
        "vehicleId": "68f8cb850e0c57d22629f656",
        "vin": "1HGCM82633A12DSKL",
        "mileage": 225,
        "recordedBy": {
          "_id": "68f8c8403867a54ec472ea29",
          "firstName": "manoj",
          "lastName": "NR",
          "role": "owner",
          "fullName": "manoj NR",
          "isLocked": false,
          "id": "68f8c8403867a54ec472ea29"
        },
        "recordedAt": "2025-10-23T07:28:39.948Z",
        "source": "automated",
        "notes": "OBD device OBD30011 reading",
        "verified": false,
        "deviceId": "OBD30011",
        "createdAt": "2025-10-23T07:28:39.948Z",
        "updatedAt": "2025-10-23T07:28:42.447Z",
        "__v": 0,
        "blockchainHash": "3MmE6CCHdKFUT9JvLv44k97We3MUWShQZwMCqAF5yekSDZfyqpe8dcEjhhy2ehgNtvN6noCGvKzf3gMErSQow9oE"
      },
      {
        "_id": "68f9d8d6c65a7a50f7374cfc",
        "vehicleId": "68f8cb850e0c57d22629f656",
        "vin": "1HGCM82633A12DSKL",
        "mileage": 195,
        "recordedBy": {
          "_id": "68f8c8403867a54ec472ea29",
          "firstName": "manoj",
          "lastName": "NR",
          "role": "owner",
          "fullName": "manoj NR",
          "isLocked": false,
          "id": "68f8c8403867a54ec472ea29"
        },
        "recordedAt": "2025-10-23T07:28:24.829Z",
        "source": "automated",
        "notes": "OBD device OBD30011 reading",
        "verified": false,
        "deviceId": "OBD30011",
        "createdAt": "2025-10-23T07:28:24.829Z",
        "updatedAt": "2025-10-23T07:28:27.578Z",
        "__v": 0,
        "blockchainHash": "3DEpD5Sqn1jPMxBxbmnfx6UbdYKApt78tG65km4xoWu8B88aVZXVjTpw4bWu8bj9bRj8RgPrjFgT2zbtig9MaDar"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 59,
      "pages": 2
    }
  }
};

const MileageHistoryDemo: React.FC = () => {
  const [data, setData] = useState(demoData.data);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">Mileage History Demo</h1>
            <p className="text-gray-600 mt-1">
              Modern table component for displaying blockchain-verified mileage records
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <MileageHistoryTable data={data} onRefresh={handleRefresh} />
      </div>
    </div>
  );
};

export default MileageHistoryDemo;

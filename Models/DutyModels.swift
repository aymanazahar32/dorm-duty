//
//  DutyModels.swift
//  DormDuty
//
//  Data models for dorm duties
//

import Foundation
import SwiftUI

// MARK: - Duty Model
struct Duty: Identifiable, Codable, Equatable {
    let id: UUID
    var title: String
    var description: String
    var assignedTo: String
    var dueDate: Date
    var isCompleted: Bool
    var priority: DutyPriority
    var roomNumber: String?
    
    init(id: UUID = UUID(),
         title: String,
         description: String,
         assignedTo: String,
         dueDate: Date,
         isCompleted: Bool = false,
         priority: DutyPriority = .medium,
         roomNumber: String? = nil) {
        self.id = id
        self.title = title
        self.description = description
        self.assignedTo = assignedTo
        self.dueDate = dueDate
        self.isCompleted = isCompleted
        self.priority = priority
        self.roomNumber = roomNumber
    }
}

// MARK: - Priority Level
enum DutyPriority: String, Codable, CaseIterable {
    case low = "Low"
    case medium = "Medium"
    case high = "High"
    case urgent = "Urgent"
    
    var color: Color {
        switch self {
        case .low: return .green
        case .medium: return .blue
        case .high: return .orange
        case .urgent: return .red
        }
    }
}

// MARK: - Duty Statistics
struct DutyStatistics {
    let totalDuties: Int
    let completedDuties: Int
    let pendingDuties: Int
    let overdueDuties: Int
    
    var completionRate: Double {
        guard totalDuties > 0 else { return 0 }
        return Double(completedDuties) / Double(totalDuties)
    }
}

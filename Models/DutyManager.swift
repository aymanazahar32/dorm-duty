//
//  DutyManager.swift
//  DormDuty
//
//  Manages all duty data and operations
//

import Foundation
import Combine

class DutyManager: ObservableObject {
    static let shared = DutyManager()
    
    @Published var duties: [Duty] = []
    
    private let saveKey = "SavedDuties"
    
    private init() {
        loadDuties()
        // Add sample data if empty
        if duties.isEmpty {
            loadSampleData()
        }
    }
    
    // MARK: - CRUD Operations
    
    func addDuty(_ duty: Duty) {
        duties.append(duty)
        saveDuties()
    }
    
    func updateDuty(_ duty: Duty) {
        if let index = duties.firstIndex(where: { $0.id == duty.id }) {
            duties[index] = duty
            saveDuties()
        }
    }
    
    func deleteDuty(_ duty: Duty) {
        duties.removeAll { $0.id == duty.id }
        saveDuties()
    }
    
    func toggleCompletion(for duty: Duty) {
        if let index = duties.firstIndex(where: { $0.id == duty.id }) {
            duties[index].isCompleted.toggle()
            saveDuties()
        }
    }
    
    // MARK: - Query Methods (Used by Siri)
    
    func getDutiesForPerson(_ person: String) -> [Duty] {
        duties.filter { $0.assignedTo.lowercased().contains(person.lowercased()) }
    }
    
    func getDutiesForRoom(_ roomNumber: String) -> [Duty] {
        duties.filter { $0.roomNumber == roomNumber }
    }
    
    func getPendingDuties() -> [Duty] {
        duties.filter { !$0.isCompleted }
    }
    
    func getCompletedDuties() -> [Duty] {
        duties.filter { $0.isCompleted }
    }
    
    func getOverdueDuties() -> [Duty] {
        let now = Date()
        return duties.filter { !$0.isCompleted && $0.dueDate < now }
    }
    
    func getDutiesByPriority(_ priority: DutyPriority) -> [Duty] {
        duties.filter { $0.priority == priority }
    }
    
    func getDutiesToday() -> [Duty] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let tomorrow = calendar.date(byAdding: .day, value: 1, to: today)!
        
        return duties.filter { duty in
            duty.dueDate >= today && duty.dueDate < tomorrow
        }
    }
    
    func getStatistics() -> DutyStatistics {
        let total = duties.count
        let completed = getCompletedDuties().count
        let pending = getPendingDuties().count
        let overdue = getOverdueDuties().count
        
        return DutyStatistics(
            totalDuties: total,
            completedDuties: completed,
            pendingDuties: pending,
            overdueDuties: overdue
        )
    }
    
    // MARK: - Persistence
    
    private func saveDuties() {
        if let encoded = try? JSONEncoder().encode(duties) {
            UserDefaults.standard.set(encoded, forKey: saveKey)
        }
    }
    
    private func loadDuties() {
        if let data = UserDefaults.standard.data(forKey: saveKey),
           let decoded = try? JSONDecoder().decode([Duty].self, from: data) {
            duties = decoded
        }
    }
    
    // MARK: - Sample Data
    
    private func loadSampleData() {
        let calendar = Calendar.current
        let today = Date()
        
        duties = [
            Duty(
                title: "Clean Common Room",
                description: "Vacuum and organize common area",
                assignedTo: "John Smith",
                dueDate: today,
                isCompleted: false,
                priority: .high,
                roomNumber: "301"
            ),
            Duty(
                title: "Take Out Trash",
                description: "Empty all trash bins on floor",
                assignedTo: "Sarah Johnson",
                dueDate: calendar.date(byAdding: .day, value: 1, to: today)!,
                isCompleted: false,
                priority: .medium,
                roomNumber: "305"
            ),
            Duty(
                title: "Clean Kitchen",
                description: "Wash dishes and wipe counters",
                assignedTo: "Mike Davis",
                dueDate: calendar.date(byAdding: .day, value: -1, to: today)!,
                isCompleted: true,
                priority: .medium,
                roomNumber: "302"
            ),
            Duty(
                title: "Bathroom Cleaning",
                description: "Clean and sanitize bathroom",
                assignedTo: "Emily Wilson",
                dueDate: today,
                isCompleted: false,
                priority: .urgent,
                roomNumber: "304"
            ),
            Duty(
                title: "Hallway Sweep",
                description: "Sweep and mop hallway",
                assignedTo: "John Smith",
                dueDate: calendar.date(byAdding: .day, value: 2, to: today)!,
                isCompleted: false,
                priority: .low,
                roomNumber: "301"
            )
        ]
        
        saveDuties()
    }
}

//
//  DutyAppIntents.swift
//  DormDuty
//
//  App Intents for Siri integration
//

import AppIntents
import Foundation

// MARK: - App Shortcuts Provider
struct DormDutyShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: GetMyDutiesIntent(),
            phrases: [
                "What are my duties in \(.applicationName)",
                "Show my \(.applicationName) duties",
                "My dorm duties"
            ],
            shortTitle: "My Duties",
            systemImageName: "list.bullet"
        )
        
        AppShortcut(
            intent: GetDutiesTodayIntent(),
            phrases: [
                "What duties are due today in \(.applicationName)",
                "Today's duties in \(.applicationName)",
                "Show today's dorm duties"
            ],
            shortTitle: "Today's Duties",
            systemImageName: "calendar"
        )
        
        AppShortcut(
            intent: GetOverdueDutiesIntent(),
            phrases: [
                "What duties are overdue in \(.applicationName)",
                "Show overdue \(.applicationName) duties",
                "Overdue dorm duties"
            ],
            shortTitle: "Overdue Duties",
            systemImageName: "exclamationmark.triangle"
        )
        
        AppShortcut(
            intent: GetDutyStatisticsIntent(),
            phrases: [
                "Get duty statistics in \(.applicationName)",
                "Show my duty progress",
                "Duty completion rate"
            ],
            shortTitle: "Duty Stats",
            systemImageName: "chart.bar"
        )
    }
}

// MARK: - Get My Duties Intent
struct GetMyDutiesIntent: AppIntent {
    static var title: LocalizedStringResource = "Get My Duties"
    static var description = IntentDescription("Get all duties assigned to you")
    
    @Parameter(title: "Person Name")
    var personName: String?
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let manager = DutyManager.shared
        
        // If no name provided, get all pending duties
        let duties: [Duty]
        if let name = personName {
            duties = manager.getDutiesForPerson(name).filter { !$0.isCompleted }
        } else {
            duties = manager.getPendingDuties()
        }
        
        let response = formatDutiesResponse(duties, forPerson: personName)
        
        return .result(dialog: IntentDialog(response))
    }
    
    private func formatDutiesResponse(_ duties: [Duty], forPerson: String?) -> String {
        guard !duties.isEmpty else {
            if let person = forPerson {
                return "\(person) has no pending duties. Great job!"
            }
            return "There are no pending duties. Everything is done!"
        }
        
        let personPrefix = forPerson.map { "\($0) has" } ?? "There are"
        let dutyList = duties.prefix(5).map { duty in
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .short
            return "- \(duty.title) (Due: \(dateFormatter.string(from: duty.dueDate)))"
        }.joined(separator: "\n")
        
        let count = duties.count
        let moreText = count > 5 ? "\n...and \(count - 5) more" : ""
        
        return "\(personPrefix) \(count) pending \(count == 1 ? "duty" : "duties"):\n\(dutyList)\(moreText)"
    }
}

// MARK: - Get Today's Duties Intent
struct GetDutiesTodayIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Today's Duties"
    static var description = IntentDescription("Get all duties due today")
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let manager = DutyManager.shared
        let duties = manager.getDutiesToday().filter { !$0.isCompleted }
        
        guard !duties.isEmpty else {
            return .result(dialog: "No duties are due today. You're all caught up!")
        }
        
        let dutyList = duties.map { duty in
            "- \(duty.title) (Assigned to: \(duty.assignedTo))"
        }.joined(separator: "\n")
        
        let count = duties.count
        let response = "There \(count == 1 ? "is" : "are") \(count) \(count == 1 ? "duty" : "duties") due today:\n\(dutyList)"
        
        return .result(dialog: IntentDialog(response))
    }
}

// MARK: - Get Overdue Duties Intent
struct GetOverdueDutiesIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Overdue Duties"
    static var description = IntentDescription("Get all overdue duties")
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let manager = DutyManager.shared
        let duties = manager.getOverdueDuties()
        
        guard !duties.isEmpty else {
            return .result(dialog: "Great news! There are no overdue duties.")
        }
        
        let dutyList = duties.prefix(5).map { duty in
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .short
            return "- \(duty.title) (Assigned to: \(duty.assignedTo), Due: \(dateFormatter.string(from: duty.dueDate)))"
        }.joined(separator: "\n")
        
        let count = duties.count
        let moreText = count > 5 ? "\n...and \(count - 5) more" : ""
        let response = "⚠️ There \(count == 1 ? "is" : "are") \(count) overdue \(count == 1 ? "duty" : "duties"):\n\(dutyList)\(moreText)"
        
        return .result(dialog: IntentDialog(response))
    }
}

// MARK: - Get Duty Statistics Intent
struct GetDutyStatisticsIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Duty Statistics"
    static var description = IntentDescription("Get statistics about duty completion")
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let manager = DutyManager.shared
        let stats = manager.getStatistics()
        
        let completionPercentage = Int(stats.completionRate * 100)
        
        let response = """
        Duty Statistics:
        📊 Total Duties: \(stats.totalDuties)
        ✅ Completed: \(stats.completedDuties)
        ⏳ Pending: \(stats.pendingDuties)
        ⚠️ Overdue: \(stats.overdueDuties)
        📈 Completion Rate: \(completionPercentage)%
        """
        
        return .result(dialog: IntentDialog(response))
    }
}

// MARK: - Get Duties by Room Intent
struct GetDutiesByRoomIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Duties by Room"
    static var description = IntentDescription("Get duties for a specific room")
    
    @Parameter(title: "Room Number")
    var roomNumber: String
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let manager = DutyManager.shared
        let duties = manager.getDutiesForRoom(roomNumber).filter { !$0.isCompleted }
        
        guard !duties.isEmpty else {
            return .result(dialog: "No pending duties found for room \(roomNumber).")
        }
        
        let dutyList = duties.map { duty in
            "- \(duty.title) (Assigned to: \(duty.assignedTo))"
        }.joined(separator: "\n")
        
        let count = duties.count
        let response = "Room \(roomNumber) has \(count) pending \(count == 1 ? "duty" : "duties"):\n\(dutyList)"
        
        return .result(dialog: IntentDialog(response))
    }
}

// MARK: - Mark Duty Complete Intent
struct MarkDutyCompleteIntent: AppIntent {
    static var title: LocalizedStringResource = "Mark Duty Complete"
    static var description = IntentDescription("Mark a duty as completed")
    
    @Parameter(title: "Duty Title")
    var dutyTitle: String
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let manager = DutyManager.shared
        
        // Find the duty by title
        if let duty = manager.duties.first(where: { 
            $0.title.lowercased().contains(dutyTitle.lowercased()) && !$0.isCompleted
        }) {
            manager.toggleCompletion(for: duty)
            return .result(dialog: "✅ Marked '\(duty.title)' as complete. Great job!")
        } else {
            return .result(dialog: "Could not find a pending duty matching '\(dutyTitle)'.")
        }
    }
}

import Foundation

// Response Models
struct InitiateAgentResponse: Codable {
    let thread_id: String
    let agent_run_id: String
}

// SSE Event Model
struct AgentStreamEvent: Codable {
    let type: String
    let status: String
    let message: String?
}

// API Client for Agent
class SunaAgentAPI {
    let baseURL: URL
    let token: String

    init(baseURL: String, token: String) {
        guard let url = URL(string: baseURL) else {
            fatalError("Invalid URL: \(baseURL)")
        }
        self.baseURL = url
        self.token = token
    }

    // Start agent run
    func startAgent(threadId: String,
                    modelName: String = "gemini-flash-2.5",
                    enableThinking: Bool = false,
                    reasoningEffort: String = "low",
                    stream: Bool = true,
                    enableContextManager: Bool = false,
                    completion: @escaping (Result<InitiateAgentResponse, Error>) -> Void) {
        let url = baseURL.appendingPathComponent("/api/thread/\(threadId)/agent/start")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "model_name": modelName,
            "enable_thinking": enableThinking,
            "reasoning_effort": reasoningEffort,
            "stream": stream,
            "enable_context_manager": enableContextManager
        ]

        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, _, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else {
                completion(.failure(NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "No data"])))
                return
            }
            do {
                let resp = try JSONDecoder().decode(InitiateAgentResponse.self, from: data)
                completion(.success(resp))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }

    // Stream agent run via SSE
    func streamAgentRun(agentRunId: String,
                        onEvent: @escaping (AgentStreamEvent) -> Void,
                        onCompletion: @escaping () -> Void) {
        let url = baseURL.appendingPathComponent("/api/agent-run/\(agentRunId)/stream")
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let task = URLSession.shared.dataTask(with: request) { data, _, _ in
            guard let data = data,
                  let text = String(data: data, encoding: .utf8) else {
                onCompletion()
                return
            }
            // Parse SSE lines
            text.split(separator: "\n\n").forEach { chunk in
                let line = chunk.trimmingCharacters(in: .whitespacesAndNewlines)
                guard line.hasPrefix("data: ") else { return }
                let jsonString = String(line.dropFirst(6))
                if let jsonData = jsonString.data(using: .utf8) {
                    if let event = try? JSONDecoder().decode(AgentStreamEvent.self, from: jsonData) {
                        onEvent(event)
                    }
                }
            }
            onCompletion()
        }
        task.resume()
    }

    // Stop agent run
    func stopAgentRun(agentRunId: String,
                      completion: @escaping (Result<Void, Error>) -> Void) {
        let url = baseURL.appendingPathComponent("/api/agent-run/\(agentRunId)/stop")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        URLSession.shared.dataTask(with: request) { _, _, error in
            if let error = error {
                completion(.failure(error))
            } else {
                completion(.success(()))
            }
        }.resume()
    }
}

// Example usage
let api = SunaAgentAPI(baseURL: "https://api.suna.so", token: "<YOUR_TOKEN>")
let threadId = "<YOUR_THREAD_ID>"

api.startAgent(threadId: threadId) { result in
    switch result {
    case .success(let resp):
        print("Started agent run: \(resp.agent_run_id)")
        api.streamAgentRun(agentRunId: resp.agent_run_id, onEvent: { event in
            print("Event: \(event.type) status=\(event.status) message=\(event.message ?? "")")
            if event.status == "completed" {
                api.stopAgentRun(agentRunId: resp.agent_run_id) { _ in
                    print("Agent run stopped")
                }
            }
        }, onCompletion: {
            print("Stream completed")
        })
    case .failure(let error):
        print("Failed to start agent: \(error)")
    }
}

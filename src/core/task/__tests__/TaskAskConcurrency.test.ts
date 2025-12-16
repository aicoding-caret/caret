// CARET MODIFICATION: ask()/say() 동시성 레이스(ask 무효화) 회귀 테스트
import { describe, it } from "mocha"
import "should"
import { Task } from "../index"
import { TaskState } from "../TaskState"

class FakeMessageStateHandler {
	private messages: any[] = []
	getClineMessages() {
		return this.messages
	}
	async addToClineMessages(message: any) {
		this.messages.push(message)
	}
}

const tick = async () => new Promise((resolve) => setTimeout(resolve, 0))

describe("Task.ask concurrency", () => {
	it("should not ignore an ask when lastMessageTs changes (e.g. say() during ask)", async () => {
		const task = Object.create(Task.prototype) as Task
		;(task as any).taskState = new TaskState()
		;(task as any).messageStateHandler = new FakeMessageStateHandler()
		;(task as any).postStateToWebview = async () => {}

		const askPromise = task.ask("tool" as any, "approve?")
		await tick()

		const askTs = (task as any).taskState.lastMessageTs as number
		;(task as any).taskState.lastMessageTs = askTs + 1

		await tick()
		await task.handleWebviewAskResponse("yesButtonClicked" as any)

		const result = await askPromise
		result.response.should.equal("yesButtonClicked")
	})

	it("should still ignore the previous ask when a new ask starts before responding", async () => {
		const task = Object.create(Task.prototype) as Task
		;(task as any).taskState = new TaskState()
		;(task as any).messageStateHandler = new FakeMessageStateHandler()
		;(task as any).postStateToWebview = async () => {}

		const ask1 = task.ask("tool" as any, "first?")
		await tick()
		const ask2 = task.ask("tool" as any, "second?")
		await tick()

		await task.handleWebviewAskResponse("yesButtonClicked" as any)
		const result2 = await ask2
		result2.response.should.equal("yesButtonClicked")

		let ask1Error: any
		try {
			await ask1
		} catch (e) {
			ask1Error = e
		}

		;(ask1Error instanceof Error).should.equal(true)
		ask1Error.message.should.equal("Current ask promise was ignored")
	})
})

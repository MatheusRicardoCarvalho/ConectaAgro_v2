import { Request, Response, Router } from "express";
import { createMessage, createThread, executeRun, getThread } from "../../lib/openai";

const openaiRoutes = Router()

openaiRoutes.get('/thread', async (req: Request,res: Response) => {
    const threadId = req.body.id
    const thread = await getThread(threadId)
    res.status(200).send({openaiThread: thread})

})
openaiRoutes.post("/thread", async (req,res) => {
    const thread = await createThread()
    res.status(200).send({thread: thread})
})

openaiRoutes.post("/bot-message", async (req,res) => {
    try{
        const threadId = req.body.threadId
    const message = await createMessage('oizinho',undefined,threadId)
    res.status(200).send({succes: true})
    } catch(e) {
        res.status(400).send({succes: false, message: e})

    }
})

openaiRoutes.post("/execute-run", async (req,res) => {
    try{
        const thread = req.body.thread
    const response = await executeRun(thread, 'asst_ZESYeHNSeof16mabUYZzLLiR')
    res.status(200).send({response: response})
    } catch(err) {
        res.status(400).send({succes: false, message: err})
    }
})

export default openaiRoutes
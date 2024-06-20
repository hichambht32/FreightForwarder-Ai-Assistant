import { ChatbotUIContext } from "@/context/context"
import { getAssistantCollectionsByAssistantId } from "@/db/assistant-collections"
import { getAssistantFilesByAssistantId } from "@/db/assistant-files"
import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
import { updateChat } from "@/db/chats"
import { getCollectionFilesByCollectionId } from "@/db/collection-files"
import { deleteMessagesIncludingAndAfter } from "@/db/messages"
import { buildFinalMessages } from "@/lib/build-prompt"
import { Tables } from "@/supabase/types"
import { ChatMessage, ChatPayload, LLMID, ModelProvider } from "@/types"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useRef } from "react"
import { v4 as uuidv4 } from "uuid"
import { LLM_LIST } from "../../../lib/models/llm/llm-list"
import {
  createTempMessages,
  handleCreateChat,
  handleCreateMessages,
  handleHostedChat,
  handleLocalChat,
  handleRetrieval,
  processResponse,
  validateChatSettings
} from "../chat-helpers"

export const useChatHandler = () => {
  const router = useRouter()

  const {
    userInput,
    chatFiles,
    setUserInput,
    setNewMessageImages,
    profile,
    setIsGenerating,
    setChatMessages,
    setFirstTokenReceived,
    selectedChat,
    selectedWorkspace,
    setSelectedChat,
    setChats,
    setSelectedTools,
    availableLocalModels,
    availableOpenRouterModels,
    abortController,
    setAbortController,
    chatSettings,
    newMessageImages,
    selectedAssistant,
    chatMessages,
    chatImages,
    setChatImages,
    setChatFiles,
    setNewMessageFiles,
    setShowFilesDisplay,
    newMessageFiles,
    chatFileItems,
    setChatFileItems,
    setToolInUse,
    useRetrieval,
    sourceCount,
    setIsPromptPickerOpen,
    setIsFilePickerOpen,
    selectedTools,
    selectedPreset,
    setChatSettings,
    models,
    isPromptPickerOpen,
    isFilePickerOpen,
    isToolPickerOpen
  } = useContext(ChatbotUIContext)

  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isPromptPickerOpen || !isFilePickerOpen || !isToolPickerOpen) {
      chatInputRef.current?.focus()
    }
  }, [isPromptPickerOpen, isFilePickerOpen, isToolPickerOpen])

  const handleNewChat = async () => {
    if (!selectedWorkspace) return

    setUserInput("")
    setChatMessages([])
    setSelectedChat(null)
    setChatFileItems([])

    setIsGenerating(false)
    setFirstTokenReceived(false)

    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)
    setIsPromptPickerOpen(false)
    setIsFilePickerOpen(false)

    setSelectedTools([])
    setToolInUse("none")

    if (selectedAssistant) {
      setChatSettings({
        model: selectedAssistant.model as LLMID,
        prompt: selectedAssistant.prompt,
        temperature: selectedAssistant.temperature,
        contextLength: selectedAssistant.context_length,
        includeProfileContext: selectedAssistant.include_profile_context,
        includeWorkspaceInstructions:
          selectedAssistant.include_workspace_instructions,
        embeddingsProvider: selectedAssistant.embeddings_provider as
          | "openai"
          | "local"
      })

      let allFiles = []

      const assistantFiles = (
        await getAssistantFilesByAssistantId(selectedAssistant.id)
      ).files
      allFiles = [...assistantFiles]
      const assistantCollections = (
        await getAssistantCollectionsByAssistantId(selectedAssistant.id)
      ).collections
      for (const collection of assistantCollections) {
        const collectionFiles = (
          await getCollectionFilesByCollectionId(collection.id)
        ).files
        allFiles = [...allFiles, ...collectionFiles]
      }
      const assistantTools = (
        await getAssistantToolsByAssistantId(selectedAssistant.id)
      ).tools

      setSelectedTools(assistantTools)
      setChatFiles(
        allFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          file: null
        }))
      )

      if (allFiles.length > 0) setShowFilesDisplay(true)
    } else if (selectedPreset) {
      setChatSettings({
        model: selectedPreset.model as LLMID,
        prompt: selectedPreset.prompt,
        temperature: selectedPreset.temperature,
        contextLength: selectedPreset.context_length,
        includeProfileContext: selectedPreset.include_profile_context,
        includeWorkspaceInstructions:
          selectedPreset.include_workspace_instructions,
        embeddingsProvider: selectedPreset.embeddings_provider as
          | "openai"
          | "local"
      })
    } else if (selectedWorkspace) {
    }

    return router.push(`/${selectedWorkspace.id}/chat`)
  }

  const handleFocusChatInput = () => {
    chatInputRef.current?.focus()
  }

  const handleStopMessage = () => {
    if (abortController) {
      abortController.abort()
    }
  }

  // version 1
  //   const handleSendMessage = async (
  //     messageContent: string,
  //     chatMessages: ChatMessage[],
  //     isRegeneration: boolean
  // ) => {

  //     const sendMessageButtonClicked = () => {
  //         console.log('Send message button clicked');
  //         handleSendMessage(messageContent, chatMessages, isRegeneration);
  //     };
  //     console.log('handleSendMessage called with message:', messageContent);

  //     const startingInput = messageContent;
  //     try {
  //         setUserInput("");
  //         setIsGenerating(true);
  //         setIsPromptPickerOpen(false);
  //         setIsFilePickerOpen(false);
  //         setNewMessageImages([]);

  //         const newAbortController = new AbortController();
  //         setAbortController(newAbortController);

  //         const modelData = [
  //             ...models.map(model => ({
  //                 modelId: model.model_id as LLMID,
  //                 modelName: model.name,
  //                 provider: "custom" as ModelProvider,
  //                 hostedId: model.id,
  //                 platformLink: "",
  //                 imageInput: false
  //             })),
  //             ...LLM_LIST,
  //             ...availableLocalModels,
  //             ...availableOpenRouterModels
  //         ].find(llm => llm.modelId === chatSettings?.model);

  //         validateChatSettings(
  //             chatSettings,
  //             modelData,
  //             profile,
  //             selectedWorkspace,
  //             messageContent
  //         );

  //         let currentChat = selectedChat ? { ...selectedChat } : null;

  //         const b64Images = newMessageImages.map(image => image.base64);

  //         let retrievedFileItems: Tables<"file_items">[] = [];

  //         if ((newMessageFiles.length > 0 || chatFiles.length > 0) && useRetrieval) {
  //             setToolInUse("retrieval");

  //             retrievedFileItems = await handleRetrieval(
  //                 userInput,
  //                 newMessageFiles,
  //                 chatFiles,
  //                 chatSettings!.embeddingsProvider,
  //                 sourceCount
  //             );
  //         }

  //         const { tempUserChatMessage, tempAssistantChatMessage } =
  //             createTempMessages(
  //                 messageContent,
  //                 chatMessages,
  //                 chatSettings!,
  //                 b64Images,
  //                 isRegeneration,
  //                 setChatMessages,
  //                 selectedAssistant
  //             );

  //         let payload: ChatPayload = {
  //             chatSettings: chatSettings!,
  //             workspaceInstructions: selectedWorkspace!.instructions || "",
  //             chatMessages: isRegeneration
  //                 ? [...chatMessages]
  //                 : [...chatMessages, tempUserChatMessage],
  //             assistant: selectedChat?.assistant_id ? selectedAssistant : null,
  //             messageFileItems: retrievedFileItems,
  //             chatFileItems: chatFileItems
  //         };

  //         let generatedText = "";

  //         const response = await fetch("http://127.0.0.1:5000/query", {
  //             method: "POST",
  //             headers: {
  //                 "Content-Type": "application/json"
  //             },
  //             body: JSON.stringify({
  //                 user_input: messageContent,
  //                 // message_id: tempAssistantChatMessage.message.id,
  //             })
  //         });

  //         const responseData = await response.json();

  //         if (responseData.responseText) {
  //           generatedText = responseData.responseText;
  //           tempAssistantChatMessage.message.content = generatedText;
  //           tempAssistantChatMessage.message.id = responseData.messageId || tempAssistantChatMessage.message.id; // Update with actual ID or use existing ID

  //           // Check if the message ID already exists in the array
  //           const isMessageExists = chatMessages.some(
  //               message => message.message.id === tempAssistantChatMessage.message.id
  //           );

  //           if (!isMessageExists) {
  //               setChatMessages(prevMessages => [...prevMessages, tempAssistantChatMessage]);
  //           }
  //       } else if (responseData.error) {
  //           console.error(responseData.error);
  //       }

  //     } catch (error) {
  //         setIsGenerating(false);
  //         setFirstTokenReceived(false);
  //         setUserInput(startingInput);
  //     }
  // };

  const handleSendMessage = async (
    messageContent: string,
    chatMessages: ChatMessage[],
    isRegeneration: boolean
  ) => {
    console.log("handleSendMessage called with message:", messageContent)

    const startingInput = messageContent
    try {
      setUserInput("")
      setIsGenerating(true)
      setIsPromptPickerOpen(false)
      setIsFilePickerOpen(false)
      setNewMessageImages([])

      const newAbortController = new AbortController()
      setAbortController(newAbortController)

      const modelData = [
        ...models.map(model => ({
          modelId: model.model_id as LLMID,
          modelName: model.name,
          provider: "custom" as ModelProvider,
          hostedId: model.id,
          platformLink: "",
          imageInput: false
        })),
        ...LLM_LIST,
        ...availableLocalModels,
        ...availableOpenRouterModels
      ].find(llm => llm.modelId === chatSettings?.model)

      validateChatSettings(
        chatSettings,
        modelData,
        profile,
        selectedWorkspace,
        messageContent
      )

      const b64Images = newMessageImages.map(image => image.base64)

      let retrievedFileItems: Tables<"file_items">[] = []

      if (
        (newMessageFiles.length > 0 || chatFiles.length > 0) &&
        useRetrieval
      ) {
        setToolInUse("retrieval")

        retrievedFileItems = await handleRetrieval(
          userInput,
          newMessageFiles,
          chatFiles,
          chatSettings!.embeddingsProvider,
          sourceCount
        )
      }

      // Generate a unique temporary ID for the user message
      const tempUserMessageId = uuidv4()

      const userChatMessage: ChatMessage = {
        message: {
          id: tempUserMessageId,
          content: messageContent,
          sequence_number: chatMessages.length + 1,
          assistant_id: selectedAssistant?.id || null,
          chat_id: selectedChat?.id || "",
          created_at: new Date().toISOString(),
          image_paths: [],
          model: chatSettings!.model,
          role: "user",
          updated_at: null,
          user_id: profile!.id
        },
        fileItems: []
      }

      // Add the user message to the state immediately
      setChatMessages(prevMessages => [...prevMessages, userChatMessage])

      const response = await fetch("http://127.0.0.1:5000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_input: messageContent
        })
      })

      const responseData = await response.json()

      if (responseData.responseText) {
        const generatedText = responseData.responseText
        const finalMessageId = responseData.messageId

        // Create the assistant message using the server-provided ID
        const assistantChatMessage: ChatMessage = {
          message: {
            id: finalMessageId,
            content: generatedText,
            sequence_number: chatMessages.length + 2,
            assistant_id: selectedAssistant?.id || null,
            chat_id: selectedChat?.id || "",
            created_at: new Date().toISOString(),
            image_paths: [],
            model: chatSettings!.model,
            role: "assistant",
            updated_at: null,
            user_id: profile!.id
          },
          fileItems: []
        }

        // Update the user message ID to match the server-provided ID
        setChatMessages(prevMessages =>
          prevMessages.map(message =>
            message.message.id === tempUserMessageId
              ? {
                  ...message,
                  message: { ...message.message, id: finalMessageId }
                }
              : message
          )
        )

        // Add the assistant message to the state
        setChatMessages(prevMessages => [...prevMessages, assistantChatMessage])
      } else if (responseData.error) {
        console.error(responseData.error)
      }
      setIsGenerating(false) // Move this outside the if-else block to ensure it always runs
      setFirstTokenReceived(false) // Similarly, move this outside the if-else block
      setUserInput(startingInput)
    } catch (error) {
      setIsGenerating(false)
      setFirstTokenReceived(false)
      setUserInput(startingInput)
    }
  }

  const handleSendEdit = async (
    editedContent: string,
    sequenceNumber: number
  ) => {
    if (!selectedChat) return

    await deleteMessagesIncludingAndAfter(
      selectedChat.user_id,
      selectedChat.id,
      sequenceNumber
    )

    const filteredMessages = chatMessages.filter(
      chatMessage => chatMessage.message.sequence_number < sequenceNumber
    )

    setChatMessages(filteredMessages)

    handleSendMessage(editedContent, filteredMessages, false)
  }

  return {
    chatInputRef,
    prompt,
    handleNewChat,
    handleSendMessage,
    handleFocusChatInput,
    handleStopMessage,
    handleSendEdit
  }
}

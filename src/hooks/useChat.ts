import { Message, Prisma } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SERVER_URI, USER_INFO } from "../constants";
import { MessageUpdatePayload, UserInfo } from "../types";
import { storage } from "../utils";

// экземпляр сокета
let socket: Socket;

export const useChat = () => {
    const userInfo = storage.get<UserInfo>(USER_INFO) as UserInfo;

    // это важно: один пользователь - один сокет
    if (!socket) {
        socket = io(SERVER_URI, {
            // помните сигнатуру объекта `handshake` на сервере?
            query: {
                userName: userInfo.userName
            }
        });
    }

    const [messages, setMessages] = useState<Message[]>();
    const [log, setLog] = useState<string>();

    useEffect(() => {
        // подключение/отключение пользователя
        socket.on("log", (log: string) => {
            setLog(log);
        });

        // получение сообщений
        socket.on("messages", (messages: Message[]) => {
            setMessages(messages);
        });

        socket.emit("messages:get");
    }, []);

    // отправка сообщения
    const send = useCallback((payload: Prisma.MessageCreateInput) => {
        socket.emit("message:post", payload);
    }, []);

    // обновление сообщения
    const update = useCallback((payload: MessageUpdatePayload) => {
        socket.emit("message:put", payload);
    }, []);

    // удаление сообщения
    const remove = useCallback((payload: Prisma.MessageWhereUniqueInput) => {
        socket.emit("message:delete", payload);
    }, []);

    // очистка сообщения - для отладки при разработке
    // можно вызывать в консоли браузера, например
    window.clearMessages = useCallback(() => {
        socket.emit("messages:clear");
        location.reload();
    }, []);

    // операции
    const chatActions = useMemo(
        () => ({
            send,
            update,
            remove
        }),
        []
    );

    return { messages, log, chatActions };
};
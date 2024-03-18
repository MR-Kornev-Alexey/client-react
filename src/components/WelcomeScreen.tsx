import React from "react";
import {FiUser, FiMail, FiLock, FiPhone} from "react-icons/fi";
import {Formik, Form, Field, ErrorMessage} from 'formik';
import * as forge from 'node-forge';
import * as Yup from 'yup';
import {UserInfo} from "../types";
import {storage} from "../utils";
import {io} from "socket.io-client";
import {SERVER_URI, USER_INFO} from "../constants";

const validationSchema = Yup.object({
    userName: Yup.string()
        .required('Введите имя и фамилию')
        .matches(/^[\u0400-\u04FF\s]+$/, 'Имя и фамилия должны содержать только буквы кириллицы и пробелы'),
    userEmail: Yup.string().email('Неверный формат электронной почты').required('Введите электронную почту'),
    userPhone: Yup.string()
        .matches(/^(\+?[78])?\d{10,11}$/, 'Неверный формат номера телефона: начинается с 8 или +7')
        .required('Введите номер телефона'),
    userPassword: Yup.string()
        .required('Придумайте пароль')
        .min(6, 'Пароль должен состоять как минимум из 6 символов')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Пароль должен содержать как минимум одну букву и одну цифру')
});

export const WelcomeScreen = () => {
    const initialValues = {
        userName: '',
        userEmail: '',
        userPhone: '',
        userPassword: ''
    };

    function sentRegistrationToServer(inputData) {
        const socket = io(SERVER_URI)
        // Подключаемся к серверу
        socket.on("connect", () => {
            console.log("Connected to server");
            // Отправляем данные на сервер
            socket.emit("message", inputData);
        });

// Обработка ответа от сервера
        socket.on("response", (data) => {
            console.log("Received response from server_old:", data);
        });

// Обработка разрыва соединения
        socket.on("disconnect", () => {
            console.log("Disconnected from server_old");
        });
    }

// Function to hash a password
    function hashPassword(password: string): string {
        // Generate a salt
        const salt = forge.random.getBytesSync(16);

        // Derive a key using PBKDF2
        const key = forge.pkcs5.pbkdf2(password, salt, 10000, 16, 'sha256');

        // Convert the key to a hexadecimal string
        return forge.util.bytesToHex(key);
    }

    const onSubmit = async (values: any, {resetForm}: any) => {
        console.log(values)
        const {userName, userEmail, userPhone, userPassword} = values;

        // Хешируем пароль с солью
        const hashedPassword = hashPassword(userPassword);

        console.log("hashedPassword -", hashedPassword)

        storage.set<UserInfo>(USER_INFO, {userEmail, hashedPassword});
        // Prepare data to be sent to the server
        const data = {
            userName,
            userEmail,
            userPhone,
            userPassword: hashedPassword
        };

        try {
            // Send data to the server using fetch
            const response = await fetch(SERVER_URI, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to register user');
            }

            console.log('User registered successfully');
            // Reset form after successful registration
            // resetForm();
        } catch (error) {
            console.error('Error registering user:', error.message);
        }
    };

    return (
        <section>
            <h1 className="title">Добро пожаловать!</h1>
            <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
                <Form className="flex flex-col items-center gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="userName" className="text-lg flex items-center justify-center">
                            <span className="mr-1">
                                <FiUser/>
                            </span>
                            <span>Введите имя и фамилию</span>
                        </label>
                        <Field type="text" id="userName" name="userName" className="input"/>
                        <ErrorMessage name="userName" component="div" className="text-red-500"/>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="userEmail" className="text-lg flex items-center justify-center">
                            <span className="mr-1">
                                <FiMail/>
                            </span>
                            <span>Введите электронную почту</span>
                        </label>
                        <Field type="email" id="userEmail" name="userEmail" className="input"/>
                        <ErrorMessage name="userEmail" component="div" className="text-red-500"/>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="userPhone" className="text-lg flex items-center justify-center">
                            <span className="mr-1">
                                <FiPhone/>
                            </span>
                            <span>Введите номер телефона</span>
                        </label>
                        <Field type="text" id="userPhone" name="userPhone" className="input"/>
                        <ErrorMessage name="userPhone" component="div" className="text-red-500"/>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="userPassword" className="text-lg flex items-center justify-center">
                            <span className="mr-1">
                                <FiLock/>
                            </span>
                            <span>Придумайте пароль</span>
                        </label>
                        <Field type="password" id="userPassword" name="userPassword" className="input"/>
                        <ErrorMessage name="userPassword" component="div" className="text-red-500"/>
                    </div>
                    <button type="submit" className="btn-success">Регистрация</button>
                </Form>
            </Formik>
        </section>
    );
};

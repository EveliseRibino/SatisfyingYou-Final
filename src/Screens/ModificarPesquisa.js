import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import storage from '@react-native-firebase/storage';
import firestore from '@react-native-firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

const ModificarPesquisa = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { pesquisaId, pesquisaData } = route.params;

    const [titulo, setTitulo] = useState(pesquisaData.titulo || '');
    const [descricao, setDescricao] = useState(pesquisaData.descricao || '');
    const [imagemUri, setImagemUri] = useState(pesquisaData.imagemUrl || '');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (imagemUri) {
            (async () => {
                try {
                    const response = await storage().refFromURL(imagemUri).getDownloadURL();
                    setImagemUri(response);
                } catch (error) {
                    console.error('Error getting image URL:', error);
                }
            })();
        }
    }, [imagemUri]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, // Ajuste para apenas imagens
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImagemUri(result.uri);
        }
    };

    const handleModificarPesquisa = async () => {
        if (!titulo || !descricao) {
            Alert.alert('Erro', 'Preencha todos os campos.');
            return;
        }

        setUploading(true);

        try {
            let newImageUrl = imagemUri;

            if (imagemUri !== pesquisaData.imagemUrl && pesquisaData.imagemUrl) {
                const oldImageRef = storage().refFromURL(pesquisaData.imagemUrl);
                await oldImageRef.delete();

                const fileName = imagemUri.substring(imagemUri.lastIndexOf('/') + 1);
                const newImageRef = storage().ref(fileName);
                await newImageRef.putFile(imagemUri);

                newImageUrl = await newImageRef.getDownloadURL();
            }

            await firestore().collection('researches').doc(pesquisaId).update({
                titulo,
                descricao,
                imagemUrl: newImageUrl,
            });

            Alert.alert('Sucesso', 'Pesquisa modificada com sucesso!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível modificar a pesquisa.');
            console.error('Error modifying research:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 20 }}>
            <Text>Título</Text>
            <TextInput
                value={titulo}
                onChangeText={setTitulo}
                style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
            />
            <Text>Descrição</Text>
            <TextInput
                value={descricao}
                onChangeText={setDescricao}
                style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
            />
            {imagemUri ? (
                <Image source={{ uri: imagemUri }} style={{ width: 200, height: 200 }} />
            ) : (
                <Text>Nenhuma imagem selecionada</Text>
            )}
            <Button title="Escolher Imagem" onPress={pickImage} />
            {uploading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <Button title="Modificar Pesquisa" onPress={handleModificarPesquisa} />
            )}
        </View>
    );
};

export default ModificarPesquisa;

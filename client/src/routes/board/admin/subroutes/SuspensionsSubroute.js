import {ReactComponent as UndrawNoData} from "assets/svg/undraw/no_data.svg";
import axios from "axios";
import {SvgNotice} from "components/commons/SvgNotice";
import BoardContext from "context/BoardContext";
import PageNodesContext from "context/PageNodesContext";
import React, {useContext, useEffect} from "react";
import {UiButton, UiElementDeleteButton} from "ui/button";
import {UiCol} from "ui/grid";
import {UiAvatar} from "ui/image";
import {UiViewBox} from "ui/viewbox";
import {toastAwait, toastError, toastSuccess, toastWarning} from "utils/basic-utils";
import {popupSwal} from "utils/sweetalert-utils";

const SuspensionSettings = () => {
    const {data: boardData, updateState} = useContext(BoardContext);
    const {setCurrentNode} = useContext(PageNodesContext);
    useEffect(() => setCurrentNode("suspensions"), [setCurrentNode]);
    const renderContent = () => {
        return <UiCol xs={12}>
            <div className={"mb-1 text-black-60"}>Suspended Users</div>
            {renderSuspensions()}
            <div>
                <UiButton className={"m-0 mt-3 float-right"} onClick={() => toastWarning("Suspend users manually through moderator tools.")}>Add New</UiButton>
            </div>
        </UiCol>
    };
    const renderSuspensions = () => {
        if (boardData.suspendedUsers.length === 0) {
            return <SvgNotice Component={UndrawNoData} title={"No suspensions yet."} description={"Lets hope nobody will never appear here."}/>
        }
        return boardData.suspendedUsers.map((suspendedUser, i) => {
            return <div className={"d-inline-flex justify-content-center mr-2"} key={i}>
                <div className={"text-center"}>
                    <UiAvatar roundedCircle user={suspendedUser.user} size={35}/>
                    <UiElementDeleteButton id={"mod_del_" + i} onClick={() => onUnsuspension(suspendedUser)} tooltipName={"Unsuspend"}/>
                    <br/>
                    <small className={"text-truncate d-block"} style={{maxWidth: 100}}>{suspendedUser.user.username}</small>
                </div>
            </div>
        });
    };
    const onUnsuspension = (suspendedUser) => {
        popupSwal("question", "Are you sure?", "This user will no longer be suspended and will be able to give feedback again.",
            "Unsuspend", "#d33", willClose => {
                if (!willClose.value) {
                    return;
                }
                const id = toastAwait("Pending unsuspension...");
                axios.delete("/suspendedUsers/" + suspendedUser.id).then(res => {
                    if (res.status !== 204) {
                        toastError("Failed to unsuspend the user", id);
                        return;
                    }
                    const suspendedUsers = boardData.suspendedUsers.filter(item => item.id !== suspendedUser.id);
                    toastSuccess("User unsuspended.", id);
                    updateState({suspendedUsers});
                }).catch(err => toastError(err.response.data.errors[0]));
            });
    };
    return <UiCol xs={12} md={9}>
        <UiViewBox title={"Suspensions Management"} description={"Manage suspended users here."}>
            {renderContent()}
        </UiViewBox>
    </UiCol>
};

export default SuspensionSettings;
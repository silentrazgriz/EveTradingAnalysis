class DbAccess {
	static getGroupIDsFromCategory(categoryID) {
		let groupIDs = [];
		for (let group of eveGroups) {
			if (group.categoryID == categoryID) {
				groupIDs.push(group.groupID);
			}
		}
		return groupIDs;
	}

	static getTypeIDsFromGroup(groupID) {
		let typeIDs = [];
		for (let type of eveTypes) {
			if (type.groupID == groupID) {
				typeIDs.push(type.typeID);
			}
		}
		return typeIDs;
	}

	static getTypeIDsFromCategory(categoryID) {
		let groupIDs = DbAccess.getGroupIDsFromCategory(categoryID);
		let typeIDs = [];
		for (let groupID of groupIDs) {
			typeIDs = typeIDs.concat(DbAccess.getTypeIDsFromGroup(groupID));
		}
		return typeIDs;
	}

	static getGroupData(groupID) {
		for (let group of eveGroups) {
			if (group.groupID == groupID) {
				return group;
			}
		}
		return null;
	}

	static getTypeData(typeID) {
		let index = BinarySearch.find(eveTypes, typeID, 'typeID');
		if (index == -1) {
			return null;
		} else {
			return eveTypes[index];
		}
	}
}
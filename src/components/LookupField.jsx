import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import Select,{components} from "react-select";
import { Form, Button } from "react-bootstrap";
import EditModals from "../utility/EditModals";
import { helperMethods } from "../utility/CMPhelper";

const LookupField = ({
  value,
  onSelect,
  entityName,
  placeholder,
  isDisabled = false,
  isInvalid = false,
  isCreateable = false,
  lookupData
}) => {
  const [allValues, setAllValues] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [tempEntityName, setTempEntityName] = useState(null);

  /** ---------------- Fetch Data ---------------- */
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await helperMethods.getEntityDetails(`${entityName}`);
      setAllValues(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [entityName]);

  /** ---------------- Build Options ---------------- */
  const options = allValues.map((record) => ({
    value: record.Id,
    label: record.Name ? record.Name : `${record.FirstName} ${record.LastName}`,
    data: record,
  }));

  /** ---------------- Sync External Value ---------------- */
  useEffect(() => {
    if (value?.Id) {
      const found = options.find((opt) => opt.value === value.Id);
      setSelected(found || null);
    } else {
      setSelected(null);
    }
  }, [value, allValues]);

  /** ---------------- On Select Change ---------------- */
  const handleChange = (option) => {
    setSelected(option);
    onSelect(option ? option.data : { Id: "", Name: "" });
  };

  /** ---------------- After Creating New Record ---------------- */
  const handleNewRecord = (data) => {
    if (!data?.Id) return;

    // Add to options list
    setAllValues((prev) => [...prev, data]);

    // Create react-select option
    const newOption = {
      value: data.Id,
      label: data.Name ? data.Name : `${data.FirstName} ${data.LastName}`,
      data,
    };

    // Select it
    setSelected(newOption);
    onSelect(data);

    // setShowModal(false);
  };

  /** ---------------- Custom Menu ---------------- */
  const Menu = (props) => (
    <components.Menu {...props}>
      <div>{props.children}</div>
      {!isDisabled && isCreateable && (
        <div style={{ borderTop: "1px solid #eee", padding: 8 }}>
          <Button
            variant="light"
            style={{ width: "100%" }}
            onClick={() => {
              if (entityName.includes("?")) {
                const tEntity = entityName.split("?");
                setTempEntityName(tEntity[0]);
              } else {
                setTempEntityName(entityName);
              }
              setShowModal(true);
            }}
          >
            + Add New
          </Button>
        </div>
      )}
    </components.Menu>
  );

  return (
    <>
      <Form.Group className="mb-3">
        <Select
          components={{ Menu }}
          options={options}
          value={selected}
          onChange={handleChange}
          isClearable
          placeholder={isLoading ? "Loading..." : placeholder || "Select..."}
          isSearchable
          isDisabled={isDisabled || isLoading}
          isLoading={isLoading}
        />

        {isInvalid && (
          <Form.Control.Feedback type="invalid" style={{ display: "block" }}>
            This field is required
          </Form.Control.Feedback>
        )}

        {error && (
          <Form.Text className="text-danger">
            Error loading options: {error}
          </Form.Text>
        )}
      </Form.Group>

      {showModal && (
        <EditModals
          onShow={showModal}
          onHide={() => setShowModal(false)}
          entityName={tempEntityName}
          createdRecord={handleNewRecord}
          lookupData={lookupData}
        />
      )}
    </>
  );
};

export default LookupField;
